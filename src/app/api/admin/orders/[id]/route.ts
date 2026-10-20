import { isValidObjectId } from "mongoose";
import { adminRoute, ApiError, ok, readJson } from "@/lib/api";
import { orderUpdateSchema } from "@/lib/validators";
import { Order, type OrderStatus } from "@/models/Order";
import { syncStockOnStatusChange } from "@/services/orders";
import { revalidateTenant } from "@/services/settings";

async function load(params: Promise<{ id: string }>) {
  const { id } = await params;
  if (!isValidObjectId(id)) throw new ApiError(400, "Invalid id");
  const order = await Order.findById(id);
  if (!order) throw new ApiError(404, "Order not found");
  return order;
}

export const GET = adminRoute<{ id: string }>(async (_req, { params }) => ok((await load(params)).toObject()));

export const PATCH = adminRoute<{ id: string }>(async (req, { params, session, tenant }) => {
  const order = await load(params);
  const { statusNote, ...data } = orderUpdateSchema.parse(await readJson(req));

  if (data.status && data.status !== order.status) {
    const from = order.status as OrderStatus;
    await syncStockOnStatusChange(order, from, data.status);
    order.statusHistory.push({ status: data.status, note: statusNote || `Updated by ${session.name}`, at: new Date() });
    if (data.status === "delivered") {
      order.deliveredAt = new Date();
      // COD orders are paid on delivery.
      if (order.paymentMethod === "cod" && !data.paymentStatus) order.paymentStatus = "paid";
    }
    revalidateTenant(tenant.id, "products"); // stock changed
  }
  order.set(data);
  await order.save();
  return ok(order.toObject());
});

export const DELETE = adminRoute<{ id: string }>(
  async (_req, { params, tenant }) => {
    const order = await load(params);
    await syncStockOnStatusChange(order, order.status as OrderStatus, "cancelled");
    await order.deleteOne();
    revalidateTenant(tenant.id, "products");
    return ok({ id: String(order._id) });
  },
  { ownerOnly: true },
);
