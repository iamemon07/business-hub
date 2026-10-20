import { ok, platformRoute, readJson } from "@/lib/api";
import { createBusinessSchema } from "@/lib/platform-validators";
import { Lead } from "@/models/platform";
import { listBusinesses } from "@/services/platform-stats";
import { createBusiness } from "@/services/provision";

export const GET = platformRoute(async () => ok(await listBusinesses()));

export const POST = platformRoute(async (req) => {
  const d = createBusinessSchema.parse(await readJson(req));
  const tenant = await createBusiness({
    name: d.name,
    slug: d.slug,
    template: d.template,
    owner: { name: d.ownerName, email: d.ownerEmail, phone: d.ownerPhone, password: d.ownerPassword },
    planId: d.planId || undefined,
    status: d.status,
    trialDays: d.trialDays,
    currencySymbol: d.currencySymbol,
    theme: d.theme,
  });
  if (d.leadId) await Lead.updateOne({ _id: d.leadId }, { status: "converted", tenant: tenant._id });
  return ok({ _id: String(tenant._id), slug: tenant.slug }, { status: 201 });
});
