import { revalidateTag } from "next/cache";
import { isValidObjectId } from "mongoose";
import { ApiError, ok, platformRoute, readJson } from "@/lib/api";
import { classifyHost, platformDomain } from "@/lib/hosts";
import { updateBusinessSchema } from "@/lib/platform-validators";
import { TENANTS_TAG } from "@/lib/tenant";
import { Tenant } from "@/models/platform";
import { deleteBusiness } from "@/services/provision";

async function load(params: Promise<{ id: string }>) {
  const { id } = await params;
  if (!isValidObjectId(id)) throw new ApiError(400, "Invalid id");
  const tenant = await Tenant.findById(id);
  if (!tenant) throw new ApiError(404, "Business not found");
  return tenant;
}

export const GET = platformRoute<{ id: string }>(async (_req, { params }) => ok((await load(params)).toObject()));

export const PUT = platformRoute<{ id: string }>(async (req, { params }) => {
  const tenant = await load(params);
  const d = updateBusinessSchema.parse(await readJson(req));

  const domains = [...new Set(d.customDomains)];
  for (const host of domains) {
    if (classifyHost(host).kind !== "custom" || host.endsWith(platformDomain().split(":")[0]))
      throw new ApiError(422, `${host} is a platform address — custom domains must be your customer's own domain`);
    if (await Tenant.exists({ _id: { $ne: tenant._id }, customDomains: host }))
      throw new ApiError(409, `${host} is already connected to another business`);
  }

  tenant.set({
    name: d.name,
    status: d.status,
    plan: d.planId || undefined,
    billingCycle: d.billingCycle,
    customPrice: d.customPrice,
    trialEndsAt: d.trialEndsAt ? new Date(d.trialEndsAt) : undefined,
    paidUntil: d.paidUntil ? new Date(d.paidUntil) : undefined,
    customDomains: domains,
    owner: d.owner,
    notes: d.notes,
    showcase: d.showcase,
  });
  await tenant.save();
  revalidateTag(TENANTS_TAG);
  return ok(tenant.toObject());
});

/** Permanently deletes the business and all its data. Requires typing the store address to confirm. */
export const DELETE = platformRoute<{ id: string }>(async (req, { params }) => {
  const tenant = await load(params);
  const { confirm } = (await readJson(req)) as { confirm?: string };
  if (confirm !== tenant.slug) throw new ApiError(400, `Type "${tenant.slug}" to confirm deletion`);
  await deleteBusiness(String(tenant._id));
  return ok({ deleted: true });
});
