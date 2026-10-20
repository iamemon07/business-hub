import { isValidObjectId } from "mongoose";
import { adminRoute, ApiError, ok } from "@/lib/api";
import { mailEnabled } from "@/lib/mail";
import { serialize } from "@/lib/serialize";
import { Order } from "@/models/Order";
import { sendInvoiceEmail } from "@/services/orders";
import { loadSettings } from "@/services/settings";
import type { OrderDTO } from "@/types";

/** Re-sends the invoice email to the customer. */
export const POST = adminRoute<{ id: string }>(async (_req, { params, tenant }) => {
  const { id } = await params;
  if (!isValidObjectId(id)) throw new ApiError(400, "Invalid id");
  const order = await Order.findById(id).lean();
  if (!order) throw new ApiError(404, "Order not found");
  if (!order.customer?.email) throw new ApiError(400, "This customer did not provide an email address");
  if (!mailEnabled()) throw new ApiError(400, "Email sending is not configured on this platform yet.");
  const sent = await sendInvoiceEmail(serialize<OrderDTO>(order), await loadSettings(), tenant.url);
  if (!sent) throw new ApiError(502, "Failed to send email — check SMTP settings");
  await Order.updateOne({ _id: id }, { invoiceSentAt: new Date() });
  return ok({ sent: true });
});
