import { z } from "zod";
import { ApiError, ok, publicRoute, readJson } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { Product } from "@/models/Product";
import { evaluateCoupon, shippingFeeFor } from "@/services/orders";
import { loadSettings } from "@/services/settings";

const quoteSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().regex(/^[a-f0-9]{24}$/i),
        size: z.string().max(40).optional().default(""),
        quantity: z.coerce.number().int().min(1).max(20),
      }),
    )
    .max(50),
  zone: z.enum(["inside", "outside"]).default("inside"),
  couponCode: z.string().trim().max(30).optional().default(""),
});

/**
 * Authoritative cart pricing — returns live prices, stock issues, coupon discount
 * and shipping so the checkout always shows what the server will actually charge.
 */
export const POST = publicRoute(async (req) => {
  if (!rateLimit(`quote:${clientIp(req)}`, 120, 60 * 1000).ok) throw new ApiError(429, "Slow down a little");
  const { items, zone, couponCode } = quoteSchema.parse(await readJson(req));
  const settings = await loadSettings();
  const products = await Product.find({ _id: { $in: items.map((i) => i.productId) } })
    .select("name price salePrice discountPercent variants active images slug")
    .lean();
  const byId = new Map(products.map((p) => [String(p._id), p]));

  const lines = items.map((i) => {
    const p = byId.get(i.productId);
    if (!p || !p.active) return { ...i, available: false, unitPrice: 0, stock: 0, issue: "No longer available" };
    const variant = p.variants.find((v) => v.size === i.size);
    const stock = p.variants.length ? (variant?.stock ?? 0) : 999;
    const unitPrice = p.salePrice || p.price;
    return {
      ...i,
      available: stock >= i.quantity,
      unitPrice,
      stock,
      issue: stock === 0 ? "Out of stock" : stock < i.quantity ? `Only ${stock} left` : "",
    };
  });

  const subtotal = lines.reduce((s, l) => s + (l.available ? l.unitPrice * l.quantity : 0), 0);
  let discount = 0;
  let couponError = "";
  let appliedCoupon = "";
  if (couponCode) {
    try {
      const res = await evaluateCoupon(couponCode, subtotal);
      discount = res.discount;
      appliedCoupon = res.code;
    } catch (e) {
      couponError = e instanceof ApiError ? e.message : "Invalid coupon";
    }
  }
  const shippingFee = subtotal > 0 ? shippingFeeFor(settings, zone, subtotal - discount) : 0;
  return ok({
    lines,
    subtotal,
    discount,
    appliedCoupon,
    couponError,
    shippingFee,
    total: subtotal - discount + shippingFee,
  });
});
