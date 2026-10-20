import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Badge, PageHeader, Panel, StatCard } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getStore } from "@/lib/store";
import { formatDate, formatPrice } from "@/lib/utils";
import { Admin } from "@/models/Admin";
import { Product } from "@/models/Product";
import { Plan, PlatformSettings, Tenant, TenantPayment } from "@/models/platform";
import { subscriptionState } from "@/services/subscription";

export const metadata: Metadata = { title: "Subscription" };

const TONE = { active: "green", trial: "blue", due_soon: "amber", overdue: "red", trial_expired: "red", suspended: "red", cancelled: "neutral" } as const;

export default async function SubscriptionPage() {
  const session = await requireAdminPage();
  if (session.role !== "owner") redirect("/admin");
  await connectDB();
  const { tenant } = await getStore();

  const [doc, platform, payments, products, staff] = await Promise.all([
    Tenant.findById(tenant.id).lean(),
    PlatformSettings.findOne({ key: "platform" }).lean(),
    TenantPayment.find({ tenant: tenant.id }).sort({ date: -1 }).limit(12).lean(),
    Product.countDocuments(),
    Admin.countDocuments({ active: true }),
  ]);
  const plan = doc?.plan ? await Plan.findById(doc.plan).lean() : null;
  const state = subscriptionState(tenant);
  const cur = platform?.currencySymbol ?? "৳";
  const price = doc?.customPrice || (doc?.billingCycle === "yearly" ? plan?.priceYearly : plan?.priceMonthly) || 0;
  const limit = (n?: number) => (n ? String(n) : "Unlimited");

  return (
    <div>
      <PageHeader title="Subscription" description={`Your ${platform?.name ?? "platform"} plan and billing.`} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Plan" value={plan?.name ?? "No plan"} sub={price ? `${formatPrice(price, cur)} / ${doc?.billingCycle === "yearly" ? "year" : "month"}` : "—"} />
        <StatCard label="Status" value={state.label} sub={<Badge tone={TONE[state.key]}>{tenant.status}</Badge>} />
        <StatCard
          label={tenant.status === "trial" ? "Trial ends" : "Paid until"}
          value={
            tenant.status === "trial"
              ? tenant.trialEndsAt ? formatDate(tenant.trialEndsAt) : "—"
              : tenant.paidUntil ? formatDate(tenant.paidUntil) : "—"
          }
        />
        <StatCard label="Store address" value={tenant.slug} sub={<a href={tenant.url} target="_blank" rel="noopener noreferrer" className="underline">{tenant.url.replace(/^https?:\/\//, "")}</a>} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Usage">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Products</dt><dd>{products} / {limit(plan?.limits?.products)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Team members</dt><dd>{staff} / {limit(plan?.limits?.staff)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Custom domain</dt><dd>{plan?.limits?.customDomain ? "Included" : "Not included"}</dd></div>
          </dl>
          {plan?.features?.length ? (
            <ul className="mt-5 list-disc space-y-1 pl-5 text-sm text-cocoa-light">
              {plan.features.map((f) => <li key={f}>{f}</li>)}
            </ul>
          ) : null}
        </Panel>

        <Panel title="Renew or Upgrade">
          <p className="text-sm text-cocoa-light">
            To renew, upgrade or connect your own domain, contact {platform?.name ?? "us"}. Your payment will be recorded and your plan
            extended right away.
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {platform?.supportPhone && <li>Phone: <a className="underline" href={`tel:${platform.supportPhone}`}>{platform.supportPhone}</a></li>}
            {platform?.whatsapp && <li>WhatsApp: <a className="underline" href={`https://wa.me/${platform.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">{platform.whatsapp}</a></li>}
            {platform?.supportEmail && <li>Email: <a className="underline" href={`mailto:${platform.supportEmail}`}>{platform.supportEmail}</a></li>}
          </ul>
        </Panel>
      </div>

      <Panel title="Payment History" className="mt-6">
        {payments.length === 0 ? (
          <p className="text-sm text-muted">No payments recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted">
                <tr><th className="py-2">Date</th><th>Amount</th><th>Method</th><th>Period</th><th>Reference</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {payments.map((p) => (
                  <tr key={String(p._id)}>
                    <td className="py-2.5">{formatDate(p.date)}</td>
                    <td>{formatPrice(p.amount, cur)}</td>
                    <td className="capitalize">{p.method}</td>
                    <td>{p.periodFrom && p.periodTo ? `${formatDate(p.periodFrom)} – ${formatDate(p.periodTo)}` : "—"}</td>
                    <td className="text-muted">{p.reference || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
