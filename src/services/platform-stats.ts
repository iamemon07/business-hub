import "server-only";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { businessUrl } from "@/lib/hosts";
import { runAsPlatform } from "@/lib/tenant-context";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { Lead, Plan, PlatformSettings, Tenant, TenantPayment } from "@/models/platform";
import { subscriptionState } from "./subscription";

/**
 * Cross-business reporting for the super admin. Runs in platform scope (no tenant filter),
 * so every aggregate groups by `tenant` explicitly.
 */
const ACTIVE = { status: { $nin: ["cancelled", "returned"] } };
const DAY = 24 * 60 * 60 * 1000;

type Totals = { revenue: number; orders: number };

async function ordersByTenant(since?: Date) {
  const match: Record<string, unknown> = { ...ACTIVE };
  if (since) match.createdAt = { $gte: since };
  const rows: { _id: Types.ObjectId; revenue: number; orders: number }[] = await Order.aggregate([
    { $match: match },
    { $group: { _id: "$tenant", revenue: { $sum: "$total" }, orders: { $sum: 1 } } },
  ]);
  return new Map<string, Totals>(rows.map((r) => [String(r._id), { revenue: r.revenue, orders: r.orders }]));
}

async function productsByTenant() {
  const rows: { _id: Types.ObjectId; count: number }[] = await Product.aggregate([{ $group: { _id: "$tenant", count: { $sum: 1 } } }]);
  return new Map(rows.map((r) => [String(r._id), r.count]));
}

export function monthlyPrice(
  t: { customPrice?: number | null; billingCycle?: string | null },
  plan?: { priceMonthly?: number | null; priceYearly?: number | null } | null,
) {
  if (t.customPrice) return t.billingCycle === "yearly" ? t.customPrice / 12 : t.customPrice;
  if (!plan) return 0;
  return t.billingCycle === "yearly" ? (plan.priceYearly ?? 0) / 12 : plan.priceMonthly ?? 0;
}

/** One row per business with live commerce stats — used by the console list and dashboard. */
export async function listBusinesses() {
  await connectDB();
  return runAsPlatform(async () => {
    const since30 = new Date(Date.now() - 30 * DAY);
    const [tenants, plans, last30, lifetime, products] = await Promise.all([
      Tenant.find().sort({ createdAt: -1 }).lean(),
      Plan.find().lean(),
      ordersByTenant(since30),
      ordersByTenant(),
      productsByTenant(),
    ]);
    const planById = new Map(plans.map((p) => [String(p._id), p]));
    return tenants.map((t) => {
      const id = String(t._id);
      const plan = t.plan ? planById.get(String(t.plan)) : undefined;
      const state = subscriptionState({
        status: t.status as "trial",
        trialEndsAt: t.trialEndsAt?.toISOString(),
        paidUntil: t.paidUntil?.toISOString(),
      });
      return {
        _id: id,
        name: t.name,
        slug: t.slug,
        url: businessUrl(t),
        template: t.template,
        status: t.status,
        state,
        plan: plan ? { _id: String(plan._id), name: plan.name } : null,
        mrr: ["active"].includes(t.status) ? monthlyPrice(t, plan) : 0,
        owner: t.owner,
        createdAt: t.createdAt.toISOString(),
        trialEndsAt: t.trialEndsAt?.toISOString() ?? null,
        paidUntil: t.paidUntil?.toISOString() ?? null,
        products: products.get(id) ?? 0,
        last30: last30.get(id) ?? { revenue: 0, orders: 0 },
        lifetime: lifetime.get(id) ?? { revenue: 0, orders: 0 },
      };
    });
  });
}

export type BusinessRow = Awaited<ReturnType<typeof listBusinesses>>[number];

export async function getPlatformDashboard() {
  await connectDB();
  const businesses = await listBusinesses();
  return runAsPlatform(async () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const since30 = new Date(Date.now() - 30 * DAY);
    const [paymentsMonth, paymentsAll, newLeads, settings, daily] = await Promise.all([
      TenantPayment.aggregate([{ $match: { date: { $gte: monthStart } } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
      TenantPayment.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]),
      Lead.countDocuments({ status: "new" }),
      PlatformSettings.findOne({ key: "platform" }).lean(),
      Order.aggregate([
        { $match: { ...ACTIVE, createdAt: { $gte: since30 } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Dhaka" } },
            revenue: { $sum: "$total" },
            orders: { $sum: 1 },
          },
        },
      ]),
    ]);

    const series = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(since30.getTime() + (i + 1) * DAY);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const row = daily.find((x: { _id: string }) => x._id === key);
      return { date: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }), revenue: row?.revenue ?? 0, orders: row?.orders ?? 0 };
    });

    const count = (pred: (b: (typeof businesses)[number]) => boolean) => businesses.filter(pred).length;
    return {
      currency: settings?.currencySymbol ?? "৳",
      counts: {
        total: businesses.length,
        active: count((b) => b.status === "active"),
        trial: count((b) => b.status === "trial"),
        suspended: count((b) => b.status === "suspended" || b.status === "cancelled"),
      },
      mrr: businesses.reduce((s, b) => s + b.mrr, 0),
      collectedThisMonth: paymentsMonth[0]?.total ?? 0,
      collectedAllTime: paymentsAll[0]?.total ?? 0,
      gmv30: businesses.reduce((s, b) => s + b.last30.revenue, 0),
      orders30: businesses.reduce((s, b) => s + b.last30.orders, 0),
      newLeads,
      series,
      top: [...businesses].sort((a, b) => b.last30.revenue - a.last30.revenue).slice(0, 6),
      attention: businesses
        .filter((b) => ["trial_expired", "overdue", "due_soon"].includes(b.state.key) || (b.state.key === "trial" && (b.state.days ?? 99) <= 5))
        .slice(0, 8),
      recent: businesses.slice(0, 5),
    };
  });
}
