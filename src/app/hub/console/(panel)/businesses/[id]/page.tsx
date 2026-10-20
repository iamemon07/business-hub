import { isValidObjectId } from "mongoose";
import { notFound } from "next/navigation";
import { BusinessDetail } from "@/components/hub/BusinessDetail";
import { connectDB } from "@/lib/db";
import { platformDomain } from "@/lib/hosts";
import { serialize } from "@/lib/serialize";
import { runWithTenant } from "@/lib/tenant-context";
import { Admin } from "@/models/Admin";
import { Plan, Tenant, TenantPayment } from "@/models/platform";
import { getPlatformSettings } from "@/services/platform";
import { listBusinesses } from "@/services/platform-stats";
import { getTemplate } from "@/templates";

export const metadata = { title: "Business" };

export default async function BusinessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidObjectId(id)) notFound();
  await connectDB();
  const tenant = await Tenant.findById(id).lean();
  if (!tenant) notFound();

  const [rows, plans, payments, admins, settings] = await Promise.all([
    listBusinesses(),
    Plan.find().sort({ sortOrder: 1 }).select("name priceMonthly priceYearly active").lean(),
    TenantPayment.find({ tenant: id }).sort({ date: -1 }).lean(),
    runWithTenant(id, () => Admin.find().sort({ createdAt: 1 }).lean()),
    getPlatformSettings(),
  ]);
  const row = rows.find((r) => r._id === id)!;

  return (
    <BusinessDetail
      row={row}
      tenant={serialize(tenant)}
      plans={serialize(plans)}
      payments={serialize(payments)}
      admins={admins.map((a) => ({ _id: String(a._id), name: a.name, email: a.email, role: a.role, active: a.active, lastLoginAt: a.lastLoginAt?.toISOString() ?? null }))}
      currency={settings.currencySymbol}
      templateName={getTemplate(tenant.template).name}
      platformDomain={platformDomain().split(":")[0]}
    />
  );
}
