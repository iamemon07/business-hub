import Link from "next/link";
import { AlertTriangle, Banknote, Building2, Inbox, ShoppingBag, TrendingUp } from "lucide-react";
import { SalesAreaChart } from "@/components/admin/Charts";
import { Badge, PageHeader, Panel, StatCard } from "@/components/admin/ui";
import { formatDate, formatPrice } from "@/lib/utils";
import { STATE_TONES } from "@/components/hub/shared";
import { getPlatformDashboard } from "@/services/platform-stats";

export const metadata = { title: "Dashboard" };

export default async function ConsoleDashboard() {
  const d = await getPlatformDashboard();
  const m = (n: number) => formatPrice(n, d.currency);

  return (
    <div>
      <PageHeader
        title="Platform Overview"
        description="All your businesses at a glance."
        actions={
          <>
            <Link href="/console/businesses/new" className="btn-primary">New Business</Link>
            <Link href="/console/businesses" className="btn-outline">All Businesses</Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Businesses"
          value={String(d.counts.total)}
          icon={<Building2 className="h-4 w-4" />}
          sub={`${d.counts.active} active · ${d.counts.trial} trial · ${d.counts.suspended} suspended`}
        />
        <StatCard label="Monthly Recurring Revenue" value={m(d.mrr)} icon={<TrendingUp className="h-4 w-4" />} sub="From active subscriptions" />
        <StatCard
          label="Collected this month"
          value={m(d.collectedThisMonth)}
          icon={<Banknote className="h-4 w-4" />}
          sub={`${m(d.collectedAllTime)} all time`}
        />
        <StatCard
          label="Store sales · 30 days"
          value={m(d.gmv30)}
          icon={<ShoppingBag className="h-4 w-4" />}
          sub={`${d.orders30} orders across all businesses`}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel title="Sales across all stores (30 days)" className="xl:col-span-2">
          <SalesAreaChart data={d.series} currency={d.currency} />
        </Panel>
        <Panel title="Needs attention">
          {d.attention.length === 0 && d.newLeads === 0 ? (
            <p className="text-sm text-muted">Nothing needs attention right now.</p>
          ) : (
            <ul className="divide-y divide-line">
              {d.newLeads > 0 && (
                <li className="flex items-center gap-3 py-2.5 text-sm">
                  <Inbox className="h-4 w-4 text-rose" />
                  <Link href="/console/leads" className="flex-1 hover:text-rose">{d.newLeads} new store request{d.newLeads > 1 ? "s" : ""}</Link>
                </li>
              )}
              {d.attention.map((b) => (
                <li key={b._id} className="flex items-center gap-3 py-2.5 text-sm">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <Link href={`/console/businesses/${b._id}`} className="min-w-0 flex-1 truncate hover:text-rose">{b.name}</Link>
                  <Badge tone={STATE_TONES[b.state.key]}>{b.state.label}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Top stores · last 30 days">
          {d.top.length === 0 ? (
            <p className="text-sm text-muted">No businesses yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {d.top.map((b) => (
                <li key={b._id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <Link href={`/console/businesses/${b._id}`} className="min-w-0 truncate font-medium hover:text-rose">{b.name}</Link>
                  <span className="shrink-0 text-muted">{b.last30.orders} orders · <span className="text-cocoa">{m(b.last30.revenue)}</span></span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Recently created">
          {d.recent.length === 0 ? (
            <p className="text-sm text-muted">Create your first business to get started.</p>
          ) : (
            <ul className="divide-y divide-line">
              {d.recent.map((b) => (
                <li key={b._id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <Link href={`/console/businesses/${b._id}`} className="block truncate font-medium hover:text-rose">{b.name}</Link>
                    <span className="text-xs text-muted">{b.template} · {formatDate(b.createdAt)}</span>
                  </div>
                  <Badge tone={STATE_TONES[b.state.key]}>{b.state.label}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
