import { revalidateTag } from "next/cache";
import { isValidObjectId } from "mongoose";
import { ApiError, ok, platformRoute, readJson } from "@/lib/api";
import { planSchema } from "@/lib/platform-validators";
import { TENANTS_TAG } from "@/lib/tenant";
import { PLATFORM_TAG } from "@/services/platform";
import { Plan, Tenant } from "@/models/platform";

async function id(params: Promise<{ id: string }>) {
  const { id } = await params;
  if (!isValidObjectId(id)) throw new ApiError(400, "Invalid id");
  return id;
}

export const PUT = platformRoute<{ id: string }>(async (req, { params }) => {
  const doc = await Plan.findByIdAndUpdate(await id(params), planSchema.parse(await readJson(req)), { new: true, runValidators: true }).lean();
  if (!doc) throw new ApiError(404, "Plan not found");
  revalidateTag(TENANTS_TAG); // plan limits are cached with each business
  revalidateTag(PLATFORM_TAG);
  return ok(doc);
});

export const DELETE = platformRoute<{ id: string }>(async (_req, { params }) => {
  const planId = await id(params);
  const inUse = await Tenant.countDocuments({ plan: planId });
  if (inUse) throw new ApiError(409, `${inUse} business(es) use this plan. Move them to another plan or deactivate it instead.`);
  await Plan.deleteOne({ _id: planId });
  return ok({ id: planId });
});
