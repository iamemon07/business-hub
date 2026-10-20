import { ApiError, ok, publicRoute, readJson } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { checkoutSchema } from "@/lib/validators";
import { createOrder } from "@/services/orders";

export const POST = publicRoute(async (req, { tenant }) => {
  if (!rateLimit(`order:${clientIp(req)}`, 10, 10 * 60 * 1000).ok)
    throw new ApiError(429, "Too many orders from this device. Please try again later.");
  const input = checkoutSchema.parse(await readJson(req));
  const order = await createOrder(input, tenant);
  return ok(
    { orderNumber: order.orderNumber, phone: order.customer.phone, total: order.total },
    { status: 201 },
  );
});
