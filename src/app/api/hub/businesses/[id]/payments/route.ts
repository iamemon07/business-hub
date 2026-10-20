import { revalidateTag } from "next/cache";
import { isValidObjectId } from "mongoose";
import { ApiError, ok, platformRoute, readJson } from "@/lib/api";
import { paymentSchema } from "@/lib/platform-validators";
import { TENANTS_TAG } from "@/lib/tenant";
import { Tenant, TenantPayment } from "@/models/platform";

async function tenantId(params: Promise<{ id: string }>) {
  const { id } = await params;
  if (!isValidObjectId(id)) throw new ApiError(400, "Invalid id");
  return id;
}

export const GET = platformRoute<{ id: string }>(async (_req, { params }) => {
  const id = await tenantId(params);
  return ok(await TenantPayment.find({ tenant: id }).sort({ date: -1 }).lean());
});

/**
 * Records a subscription payment. When it covers N months, the business's paid-until date is
 * extended by N months (from the later of today or the current paid-until) and it becomes active.
 */
export const POST = platformRoute<{ id: string }>(async (req, { params, admin }) => {
  const id = await tenantId(params);
  const tenant = await Tenant.findById(id);
  if (!tenant) throw new ApiError(404, "Business not found");
  const d = paymentSchema.parse(await readJson(req));

  let periodFrom: Date | undefined;
  let periodTo: Date | undefined;
  if (d.months > 0) {
    const now = new Date();
    periodFrom = tenant.paidUntil && tenant.paidUntil > now ? new Date(tenant.paidUntil) : now;
    periodTo = new Date(periodFrom);
    periodTo.setMonth(periodTo.getMonth() + d.months);
    tenant.paidUntil = periodTo;
    if (tenant.status === "trial" || tenant.status === "suspended") tenant.status = "active";
    await tenant.save();
    revalidateTag(TENANTS_TAG);
  }

  const payment = await TenantPayment.create({
    tenant: id,
    date: new Date(d.date),
    amount: d.amount,
    method: d.method,
    reference: d.reference,
    note: d.note,
    periodFrom,
    periodTo,
    recordedBy: admin.name,
  });
  return ok(payment.toObject(), { status: 201 });
});

export const DELETE = platformRoute<{ id: string }>(async (req, { params }) => {
  const id = await tenantId(params);
  const paymentId = new URL(req.url).searchParams.get("paymentId") ?? "";
  if (!isValidObjectId(paymentId)) throw new ApiError(400, "Invalid payment id");
  await TenantPayment.deleteOne({ _id: paymentId, tenant: id });
  return ok({ deleted: true });
});
