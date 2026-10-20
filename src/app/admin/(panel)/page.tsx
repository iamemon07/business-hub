import Link from "next/link";
import { AlertTriangle, Banknote, Clock, Package, ShoppingBag, TrendingUp } from "lucide-react";
import { SalesAreaChart } from "@/components/admin/Charts";
import { Badge, PageHeader, Panel, StatCard } from "@/components/admin/ui";
import { STATUS_TONES } from "@/components/admin/tones";
import { getSession } from "@/lib/auth";
import { formatDate, formatPrice } from "@/lib/utils";
import { getDashboardStats } from "@/services/reports";
import { loadSettings } from "@/services/settings";

export default async function DashboardPage() {
  const settings = await loadSettings();
  const [stats, session] = await Promise.all([getDashboardStats(settings.orders?.timezone), getSession()]);
  const m = (n: number) => formatPrice(n, settings.currencySymbol);
  const pending = (stats.counts.pending ?? 0) + (stats.counts.confirmed ?? 0) + (stats.counts.processing ?? 0);
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div>
      <PageHeader
        title={`${greet}, ${session?.name.split(" ")[0] ?? ""}`}
        description="Here's what's happening with your store today."
        actions={
          <>
            <Link href="/admin/products/new" className="btn-primary">Add Product</Link>
            <Link href="/admin/orders" className="btn-outline">View Orders</Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Today's Sales" value={m(stats.today.revenue)} sub={`${stats.today.orders} order(s)`} icon={<Banknote className="h-4 w-4" />} />
        <StatCard label="This Month" value={m(stats.month.revenue)} sub={`${stats.month.orders} orders · AOV ${m(stats.month.orders ? stats.month.revenue / stats.month.orders : 0)}`} icon={<TrendingUp className="h-4 w-4" />} />
        {session?.role === "owner" ? (
          <StatCard
            label="Month Net Profit"
            value={m(stats.monthNetProfit)}
            tone={stats.monthNetProfit >= 0 ? "positive" : "negative"}
            sub={<Link href="/admin/finance" className="text-rose hover:underline">Open P&L →</Link>}
            icon={<ShoppingBag className="h-4 w-4" />}
          />
        ) : (
          <StatCard label="Units Sold (Month)" value={String(stats.month.units)} icon={<ShoppingBag className="h-4 w-4" />} />
        )}
        <StatCard label="Orders To Process" value={String(pending)} sub={<Link href="/admin/orders?status=pending" className="text-rose hover:underline">{stats.counts.pending ?? 0} awaiting confirmation →</Link>} icon={<Clock className="h-4 w-4" />} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel title="Sales — last 30 days" className="xl:col-span-2">
          <SalesAreaChart data={stats.series} currency={settings.currencySymbol} />
        </Panel>
        <Panel title="Order Pipeline">
          <ul className="space-y-3">
            {["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"].map((s) => (
              <li key={s}>
                <Link href={`/admin/orders?status=${s}`} className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-blush-50">
                  <Badge tone={STATUS_TONES[s]}>{s}</Badge>
                  <span className="font-display text-xl">{stats.counts[s] ?? 0}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel title="Recent Orders" className="xl:col-span-2" actions={<Link href="/admin/orders" className="text-xs uppercase tracking-wider text-rose">All orders</Link>}>
          {stats.recent.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">No orders yet — they&apos;ll appear here.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead className="text-left text-[11px] uppercase tracking-wider text-muted">
                  <tr><th className="pb-3">Order</th><th className="pb-3">Customer</th><th className="pb-3">Date</th><th className="pb-3">Status</th><th className="pb-3 text-right">Total</th></tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {stats.recent.map((o) => (
                    <tr key={o._id}>
                      <td className="py-3"><Link href={`/admin/orders/${o._id}`} className="font-medium text-rose hover:underline">#{o.orderNumber}</Link></td>
                      <td className="py-3">{o.customer.name}</td>
                      <td className="py-3 text-muted">{formatDate(o.createdAt)}</td>
                      <td className="py-3"><Badge tone={STATUS_TONES[o.status]}>{o.status}</Badge></td>
                      <td className="py-3 text-right font-medium">{m(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
        <Panel title="Low Stock" actions={<span className="text-xs text-muted">{stats.productCount} active products</span>}>
          {stats.lowStock.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center text-sm text-muted">
              <Package className="mb-2 h-6 w-6 text-rose" /> Everything is well stocked.
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {stats.lowStock.map((p) => (
                <li key={`${p._id}-${p.size}`} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <Link href={`/admin/products/${p._id}`} className="truncate hover:text-rose">
                    {p.name} <span className="text-muted">· {p.size}</span>
                  </Link>
                  <span className={p.stock === 0 ? "flex items-center gap-1 text-red-600" : "text-amber-700"}>
                    {p.stock === 0 && <AlertTriangle className="h-3.5 w-3.5" />}
                    {p.stock}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
