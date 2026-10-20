import { revalidateTag } from "next/cache";
import { ok, platformRoute, readJson } from "@/lib/api";
import { planSchema } from "@/lib/platform-validators";
import { Plan } from "@/models/platform";
import { PLATFORM_TAG } from "@/services/platform";

export const GET = platformRoute(async () => ok(await Plan.find().sort({ sortOrder: 1, priceMonthly: 1 }).lean()));

export const POST = platformRoute(async (req) => {
  const plan = await Plan.create(planSchema.parse(await readJson(req)));
  revalidateTag(PLATFORM_TAG);
  return ok(plan.toObject(), { status: 201 });
});
