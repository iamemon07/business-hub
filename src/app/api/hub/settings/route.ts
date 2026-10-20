import { revalidateTag } from "next/cache";
import { ok, platformRoute, readJson } from "@/lib/api";
import { platformSettingsSchema } from "@/lib/platform-validators";
import { PlatformSettings } from "@/models/platform";
import { getPlatformSettings, PLATFORM_TAG } from "@/services/platform";

export const GET = platformRoute(async () => ok(await getPlatformSettings()));

export const PUT = platformRoute(async (req) => {
  const data = platformSettingsSchema.parse(await readJson(req));
  const doc = await PlatformSettings.findOneAndUpdate({ key: "platform" }, { $set: data }, { new: true, upsert: true }).lean();
  revalidateTag(PLATFORM_TAG);
  return ok(doc);
});
