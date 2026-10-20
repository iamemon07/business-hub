import "server-only";
import { unstable_cache } from "next/cache";
import { connectDB } from "@/lib/db";
import { serialize } from "@/lib/serialize";
import { Plan, PlatformSettings, Tenant } from "@/models/platform";
import { businessUrl } from "@/lib/hosts";

export const PLATFORM_TAG = "platform";

export type PlatformSettingsDTO = {
  name: string;
  tagline: string;
  currencySymbol: string;
  supportEmail: string;
  supportPhone: string;
  whatsapp: string;
  hero: { title: string; subtitle: string };
  leadsEnabled: boolean;
  trialDays: number;
};

/** Platform settings singleton (created with defaults on first read). Uncached. */
export async function getPlatformSettings(): Promise<PlatformSettingsDTO> {
  await connectDB();
  let doc = await PlatformSettings.findOne({ key: "platform" }).lean();
  if (!doc) {
    await PlatformSettings.updateOne({ key: "platform" }, { $setOnInsert: { key: "platform" } }, { upsert: true });
    doc = await PlatformSettings.findOne({ key: "platform" }).lean();
  }
  return serialize<PlatformSettingsDTO>(doc);
}

/** Cached data for the public landing page: settings, public plans and showcase stores. */
export const getLandingData = unstable_cache(
  async () => {
    const settings = await getPlatformSettings();
    const [plans, showcase] = await Promise.all([
      Plan.find({ active: true, public: true }).sort({ sortOrder: 1, priceMonthly: 1 }).lean(),
      Tenant.find({ showcase: true, status: { $in: ["active", "trial"] } }).select("name slug customDomains template").limit(8).lean(),
    ]);
    return {
      settings,
      plans: serialize<
        { _id: string; name: string; key: string; description: string; priceMonthly: number; priceYearly: number; features: string[]; limits: { products: number; staff: number; customDomain: boolean } }[]
      >(plans),
      showcase: showcase.map((t) => ({ name: t.name, template: t.template, url: businessUrl(t) })),
    };
  },
  ["landing-data"],
  { tags: [PLATFORM_TAG, "tenants"], revalidate: 600 },
);
