import "server-only";
import { Types } from "mongoose";
import { ApiError } from "@/lib/api";
import { estimateDelivery } from "@/lib/delivery";
import { adminOrderEmailHtml, invoiceEmailHtml } from "@/lib/invoice-email";
import { sendMail } from "@/lib/mail";
import { serialize } from "@/lib/serialize";
import type { CheckoutInput } from "@/lib/validators";
import { Coupon } from "@/models/Coupon";
import { nextSequence } from "@/models/Counter";
import { Order, type OrderStatus } from "@/models/Order";
import { Product } from "@/models/Product";
import type { OrderDTO, SettingsDTO, TenantInfo } from "@/types";
import { loadSettings } from "./settings";

export function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("88") ? digits.slice(2) : digits;
}

/** Validates a coupon against a subtotal and returns the discount amount. */
export async function evaluateCoupon(code: string, subtotal: number) {
  const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() }).lean();
  const now = new Date();
  if (!coupon || !coupon.active) throw new ApiError(400, "This coupon code is not valid");
  if (coupon.startsAt && coupon.startsAt > now) throw new ApiError(400, "This coupon is not active yet");
  if (coupon.expiresAt && coupon.expiresAt < now) throw new ApiError(400, "This coupon has expired");
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit)
    throw new ApiError(400, "This coupon has reached its usage limit");
  if (subtotal < coupon.minOrder)
    throw new ApiError(400, `Minimum order of ${coupon.minOrder} required for this coupon`);

  let discount = coupon.type === "percent" ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
  if (coupon.maxDiscount > 0) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.min(discount, subtotal);
  return { code: coupon.code, discount, coupon };
}

export function shippingFeeFor(settings: SettingsDTO, zone: "inside" | "outside", amountAfterDiscount: number) {
  const { freeShippingThreshold, insideFee, outsideFee } = settings.shipping;
  if (freeShippingThreshold > 0 && amountAfterDiscount >= freeShippingThreshold) return 0;
  return zone === "inside" ? insideFee : outsideFee;
}

type StockMove = { productId: Types.ObjectId; size: string; quantity: number; hasVariants: boolean };

async function applyStock(moves: StockMove[], direction: 1 | -1) {
  for (const m of moves) {
    if (m.hasVariants && m.size) {
      await Product.updateOne(
        { _id: m.productId, "variants.size": m.size },
        { $inc: { "variants.$.stock": direction * m.quantity, soldCount: -direction * m.quantity } },
      );
    } else {
      await Product.updateOne({ _id: m.productId }, { $inc: { soldCount: -direction * m.quantity } });
    }
  }
}

/**
 * Creates an order with server-side pricing (never trusts client prices),
 * atomically reserves stock with compensation on failure, and sends the invoice email.
 */
export async function createOrder(input: CheckoutInput, tenant: TenantInfo) {
  const settings = await loadSettings();

  const methodEnabled =
    input.paymentMethod === "cod" ? settings.payments.cod.enabled : settings.payments[input.paymentMethod]?.enabled;
  if (!methodEnabled) throw new ApiError(400, "Selected payment method is not available");

  const ids = [...new Set(input.items.map((i) => i.productId))];
  const products = await Product.find({ _id: { $in: ids }, active: true }).lean();
  const byId = new Map(products.map((p) => [String(p._id), p]));

  const items = input.items.map((line) => {
    const p = byId.get(line.productId);
    if (!p) throw new ApiError(400, "One of the products in your cart is no longer available");
    const hasVariants = p.variants.length > 0;
    if (hasVariants) {
      const v = p.variants.find((x) => x.size === line.size);
      if (!v) throw new ApiError(400, `Please choose an option for ${p.name}`);
      if (v.stock < line.quantity)
        throw new ApiError(409, `Only ${v.stock} left of ${p.name} (${line.size})`);
    }
    if (line.color && p.colors.length && !p.colors.includes(line.color))
      throw new ApiError(400, `Invalid color for ${p.name}`);
    const unitPrice = p.salePrice || p.price;
    return {
      product: p._id,
      name: p.name,
      slug: p.slug,
      image: p.images[0] ?? "",
      size: hasVariants ? line.size : "",
      color: line.color || "",
      quantity: line.quantity,
      unitPrice,
      unitCost: p.costPrice ?? 0,
      lineTotal: unitPrice * line.quantity,
      hasVariants,
    };
  });

  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  let discount = 0;
  let couponCode = "";
  let couponId: Types.ObjectId | null = null;
  if (input.couponCode) {
    const res = await evaluateCoupon(input.couponCode, subtotal);
    discount = res.discount;
    couponCode = res.code;
    couponId = res.coupon._id as Types.ObjectId;
  }
  const shippingFee = shippingFeeFor(settings, input.shipping.zone, subtotal - discount);
  const total = subtotal - discount + shippingFee;

  // Reserve stock atomically: each decrement only succeeds if enough stock remains.
  const reserved: StockMove[] = [];
  try {
    for (const i of items) {
      if (i.hasVariants) {
        const res = await Product.updateOne(
          { _id: i.product, variants: { $elemMatch: { size: i.size, stock: { $gte: i.quantity } } } },
          { $inc: { "variants.$.stock": -i.quantity, soldCount: i.quantity } },
        );
        if (res.modifiedCount === 0) throw new ApiError(409, `${i.name} (${i.size}) just sold out`);
      } else {
        await Product.updateOne({ _id: i.product }, { $inc: { soldCount: i.quantity } });
      }
      reserved.push({ productId: i.product as Types.ObjectId, size: i.size, quantity: i.quantity, hasVariants: i.hasVariants });
    }

    if (couponId) {
      const res = await Coupon.updateOne(
        { _id: couponId, $or: [{ usageLimit: 0 }, { $expr: { $lt: ["$usedCount", "$usageLimit"] } }] },
        { $inc: { usedCount: 1 } },
      );
      if (res.modifiedCount === 0) throw new ApiError(400, "This coupon has reached its usage limit");
    }

    const seq = await nextSequence("order");
    const now = new Date();
    const eta = estimateDelivery(now, settings.shipping.minDays, settings.shipping.maxDays, settings.shipping.weekendDays);

    const order = await Order.create({
      orderNumber: `${(settings.orders?.prefix || "OR").toUpperCase()}${String(10000 + seq)}`,
      customer: { ...input.customer, phone: normalizePhone(input.customer.phone) },
      shipping: input.shipping,
      items: items.map(({ hasVariants: _h, ...rest }) => rest),
      subtotal,
      discount,
      couponCode,
      shippingFee,
      total,
      paymentMethod: input.paymentMethod,
      paymentStatus: "pending",
      transactionId: input.transactionId,
      senderNumber: input.senderNumber,
      status: "pending",
      statusHistory: [{ status: "pending", note: "Order placed", at: now }],
      estimatedDelivery: eta,
    });

    const dto = serialize<OrderDTO>(order.toObject());
    // Awaited on purpose: serverless functions (Netlify) freeze once the response is sent,
    // so fire-and-forget emails never finish. sendMail never throws, so this can't fail checkout.
    await notifyNewOrder(dto, settings, tenant.url);
    return dto;
  } catch (err) {
    await applyStock(reserved, 1).catch((e) => console.error("[order] stock rollback failed", e));
    throw err;
  }
}

async function notifyNewOrder(order: OrderDTO, settings: SettingsDTO, siteUrl: string) {
  const tasks: Promise<unknown>[] = [];
  if (order.customer.email) {
    tasks.push(
      sendInvoiceEmail(order, settings, siteUrl).then((sent) =>
        sent ? Order.updateOne({ _id: order._id }, { invoiceSentAt: new Date() }) : null,
      ),
    );
  }
  const notify = settings.orders?.notifyEmail;
  if (notify) {
    tasks.push(
      sendMail({
        to: notify,
        fromName: settings.storeName,
        subject: `New order ${order.orderNumber} — ${settings.currencySymbol}${order.total}`,
        html: adminOrderEmailHtml(order, settings, siteUrl),
      }),
    );
  }
  await Promise.allSettled(tasks);
}

export function sendInvoiceEmail(order: OrderDTO, settings: SettingsDTO, siteUrl: string) {
  return sendMail({
    to: order.customer.email,
    fromName: settings.storeName,
    replyTo: settings.email,
    subject: `Your ${settings.storeName} order #${order.orderNumber} — Invoice`,
    html: invoiceEmailHtml(order, settings, siteUrl),
  });
}

const INACTIVE: OrderStatus[] = ["cancelled", "returned"];

/** Restocks when an order becomes cancelled/returned and re-deducts if it's reactivated. */
export async function syncStockOnStatusChange(
  order: { items: { product?: unknown; size?: string | null; quantity?: number | null }[] },
  from: OrderStatus,
  to: OrderStatus,
) {
  const wasInactive = INACTIVE.includes(from);
  const isInactive = INACTIVE.includes(to);
  if (wasInactive === isInactive) return;
  const moves: StockMove[] = order.items
    .filter((i) => i.product)
    .map((i) => ({
      productId: i.product as Types.ObjectId,
      size: i.size ?? "",
      quantity: i.quantity ?? 0,
      hasVariants: Boolean(i.size),
    }));
  await applyStock(moves, isInactive ? 1 : -1);
}

export async function findOrderForCustomer(orderNumber: string, phone: string) {
  const order = await Order.findOne({
    orderNumber: orderNumber.toUpperCase(),
    "customer.phone": normalizePhone(phone),
  })
    .select("-items.unitCost -courierCost -adminNote")
    .lean();
  return order ? serialize<OrderDTO>(order) : null;
}
