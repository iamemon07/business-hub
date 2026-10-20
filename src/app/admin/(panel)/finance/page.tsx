"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Info, Loader2, TrendingDown, TrendingUp, Wallet, Boxes, Target } from "lucide-react";
import { ExpensePie, PIE_COLORS, PLChart } from "@/components/admin/Charts";
import { PageHeader, Panel, StatCard } from "@/components/admin/ui";
import { api } from "@/lib/client-api";
import { cn, formatPrice } from "@/lib/utils";
import type { FinanceReport } from "@/services/reports";

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function presets() {
  const now = new Date();
  const y = now.getFullYear();
  const mo = now.getMonth();
  return [
    { key: "month", label: "This Month", from: new Date(y, mo, 1), to: now },
    { key: "last-month", label: "Last Month", from: new Date(y, mo - 1, 1), to: new Date(y, mo, 0) },
    { key: "3m", label: "Last 3 Months", from: new Date(y, mo - 2, 1), to: now },
    { key: "12m", label: "Last 12 Months", from: new Date(y, mo - 11, 1), to: now },
    { key: "year", label: "This Year", from: new Date(y, 0, 1), to: now },
  ];
}

const pct = (n: number) => `${n.toFixed(1)}%`;

export default function FinancePage() {
  const [range, setRange] = useState(() => {
    const p = presets()[3];
    return { key: p.key, from: iso(p.from), to: iso(p.to) };
  });
  const [data, setData] = useState<FinanceReport | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api<FinanceReport>(`/api/admin/reports?from=${range.from}&to=${range.to}`));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [range.from, range.to]);

  useEffect(() => {
    load();
  }, [load]);

  const m = (n: number) => formatPrice(n);
  const p = data?.period;

  return (
    <div>
      <PageHeader
        title="Profit & Loss / ROI"
        description="Your complete business health — revenue, costs, profit, return on investment and cash position."
        actions={
          <>
            <Link href="/admin/expenses" className="btn-soft">Add Expense</Link>
            <Link href="/admin/investments" className="btn-outline">Investments</Link>
          </>
        }
      />

      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {presets().map((pr) => (
            <button
              key={pr.key}
              onClick={() => setRange({ key: pr.key, from: iso(pr.from), to: iso(pr.to) })}
              className={cn("shrink-0 rounded-full border px-3.5 py-1.5 text-xs transition", range.key === pr.key ? "border-cocoa bg-cocoa text-ivory" : "border-line hover:border-rose")}
            >
              {pr.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <input type="date" value={range.from} onChange={(e) => setRange((r) => ({ ...r, key: "custom", from: e.target.value }))} className="input w-auto py-2" />
          <span className="text-muted">→</span>
          <input type="date" value={range.to} onChange={(e) => setRange((r) => ({ ...r, key: "custom", to: e.target.value }))} className="input w-auto py-2" />
        </div>
      </div>

      {loading && !data ? (
        <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-rose" /></div>
      ) : data && p ? (
        <div className={cn("space-y-6 transition-opacity", loading && "opacity-60")}>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Revenue" value={m(p.revenue)} sub={`${p.orders} orders · ${p.units} pcs · AOV ${m(p.aov)}`} icon={<TrendingUp className="h-4 w-4" />} />
            <StatCard label="Gross Profit" value={m(p.grossProfit)} sub={`Margin ${pct(p.grossMargin)} (after product cost)`} tone={p.grossProfit >= 0 ? "positive" : "negative"} />
            <StatCard label="Net Profit" value={m(p.netProfit)} sub={`Net margin ${pct(p.netMargin)}`} tone={p.netProfit >= 0 ? "positive" : "negative"} icon={p.netProfit >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />} />
            <StatCard label="ROI (lifetime)" value={pct(data.investment.roi)} sub={`On ${m(data.investment.capitalIn)} invested · period ${pct(data.investment.periodRoi)}`} tone={data.investment.roi >= 0 ? "positive" : "negative"} icon={<Target className="h-4 w-4" />} />
          </div>

          <Panel title="Monthly Performance">
            <PLChart data={data.monthly} currency="৳" />
          </Panel>

          <div className="grid gap-6 xl:grid-cols-2">
            <Panel title="Profit & Loss Statement">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-line">
                  <Row label="Gross sales (product value)" value={m(p.grossSales)} />
                  <Row label="− Discounts & coupons" value={`−${m(p.discounts)}`} muted />
                  <Row label="Net product sales" value={m(p.netSales)} strong />
                  <Row label="− Cost of goods sold (COGS)" value={`−${m(p.cogs)}`} muted hint="Units sold × each product's cost price" />
                  <Row label="Gross profit" value={m(p.grossProfit)} strong tone={p.grossProfit >= 0 ? "pos" : "neg"} />
                  <Row label="+ Delivery charges collected" value={m(p.shippingIncome)} muted />
                  <Row label="− Courier costs (per order)" value={`−${m(p.courierCost)}`} muted />
                  <Row label="− Operating expenses" value={`−${m(p.expenses.operating)}`} muted hint="All expenses except inventory purchases" />
                  <Row label="Net profit" value={m(p.netProfit)} strong big tone={p.netProfit >= 0 ? "pos" : "neg"} />
                </tbody>
              </table>
              <p className="mt-4 flex gap-2 rounded-xl bg-blush-50 p-3 text-xs text-cocoa-light">
                <Info className="h-4 w-4 shrink-0 text-rose" />
                Cancelled and returned orders are excluded. Set each product&apos;s cost price for accurate COGS.
              </p>
            </Panel>

            <Panel title="Expenses Breakdown">
              {p.expenses.byCategory.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted">No expenses recorded in this period. <Link href="/admin/expenses" className="text-rose underline">Add one</Link></p>
              ) : (
                <div className="grid items-center gap-4 sm:grid-cols-2">
                  <ExpensePie data={p.expenses.byCategory} currency="৳" />
                  <ul className="space-y-2 text-sm">
                    {p.expenses.byCategory.map((c, i) => (
                      <li key={c.category} className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />{c.label}</span>
                        <span className="font-medium">{m(c.total)}</span>
                      </li>
                    ))}
                    <li className="flex justify-between border-t border-line pt-2 font-semibold"><span>Total</span><span>{m(p.expenses.all)}</span></li>
                  </ul>
                </div>
              )}
            </Panel>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <Panel title="Return on Investment">
              <div className="space-y-4 text-sm">
                <KV k="Capital invested" v={m(data.investment.capitalIn)} />
                <KV k="Owner withdrawals" v={m(data.investment.withdrawals)} />
                <KV k="Lifetime net profit" v={m(data.lifetime.netProfit)} tone={data.lifetime.netProfit >= 0 ? "pos" : "neg"} />
                <div>
                  <div className="mb-1.5 flex justify-between text-xs"><span className="text-muted">Payback progress</span><span className="font-medium">{pct(data.investment.paybackProgress)}</span></div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-blush-100"><div className="h-full rounded-full bg-gradient-to-r from-rose to-cocoa transition-all" style={{ width: `${data.investment.paybackProgress}%` }} /></div>
                  <p className="mt-2 text-xs text-muted">
                    {data.investment.capitalIn === 0 ? <>Add your <Link href="/admin/investments" className="text-rose underline">investments</Link> to track ROI.</> : data.investment.paybackRemaining > 0 ? `${m(data.investment.paybackRemaining)} more net profit to recover your investment.` : "🎉 You've fully recovered your investment!"}
                  </p>
                </div>
              </div>
            </Panel>
            <Panel title="Cash Position (lifetime)" actions={<Wallet className="h-4 w-4 text-rose" />}>
              <div className="space-y-4 text-sm">
                <KV k="Capital in" v={m(data.investment.capitalIn)} />
                <KV k="Collected from customers" v={m(data.cash.cashIn)} hint="Paid or delivered orders" />
                <KV k="Cash spent (all expenses + courier)" v={`−${m(data.cash.cashOut)}`} />
                <KV k="Withdrawals" v={`−${m(data.investment.withdrawals)}`} />
                <div className="border-t border-line pt-3"><KV k="Estimated cash in hand" v={m(data.cash.cashBalance)} tone={data.cash.cashBalance >= 0 ? "pos" : "neg"} strong /></div>
              </div>
            </Panel>
            <Panel title="Inventory Value" actions={<Boxes className="h-4 w-4 text-rose" />}>
              <div className="space-y-4 text-sm">
                <KV k="Units in stock" v={data.inventory.units.toLocaleString()} />
                <KV k="Stock value at cost" v={m(data.inventory.atCost)} />
                <KV k="Stock value at selling price" v={m(data.inventory.atRetail)} />
                <KV k="Potential gross profit in stock" v={m(data.inventory.atRetail - data.inventory.atCost)} tone="pos" strong />
              </div>
            </Panel>
          </div>

          <Panel title="Top Products (by revenue)">
            {data.topProducts.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">No sales in this period.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-sm">
                  <thead className="text-left text-[11px] uppercase tracking-wider text-muted">
                    <tr><th className="pb-3">Product</th><th className="pb-3 text-right">Units</th><th className="pb-3 text-right">Revenue</th><th className="pb-3 text-right">Cost</th><th className="pb-3 text-right">Profit</th><th className="pb-3 text-right">Margin</th></tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {data.topProducts.map((t: { _id: string; name: string; image: string; units: number; revenue: number; cost: number; profit: number }) => (
                      <tr key={t._id}>
                        <td className="py-2.5">
                          <div className="flex items-center gap-3">
                            <div className="relative h-10 w-8 overflow-hidden rounded bg-blush-100">{t.image && <Image src={t.image} alt="" fill sizes="32px" className="object-cover" unoptimized={!t.image.startsWith("/")} />}</div>
                            {t.name}
                          </div>
                        </td>
                        <td className="py-2.5 text-right">{t.units}</td>
                        <td className="py-2.5 text-right">{m(t.revenue)}</td>
                        <td className="py-2.5 text-right text-muted">{m(t.cost)}</td>
                        <td className={cn("py-2.5 text-right font-medium", t.profit >= 0 ? "text-emerald-700" : "text-red-700")}>{m(t.profit)}</td>
                        <td className="py-2.5 text-right">{t.revenue ? pct((t.profit / t.revenue) * 100) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>
      ) : null}
    </div>
  );
}

function Row({ label, value, strong, big, muted, tone, hint }: { label: string; value: string; strong?: boolean; big?: boolean; muted?: boolean; tone?: "pos" | "neg"; hint?: string }) {
  return (
    <tr>
      <td className={cn("py-2.5", muted && "pl-3 text-muted", strong && "font-semibold")}>
        {label}
        {hint && <span className="block text-[11px] font-normal text-muted/80">{hint}</span>}
      </td>
      <td className={cn("py-2.5 text-right", strong && "font-semibold", big && "font-display text-2xl", tone === "pos" && "text-emerald-700", tone === "neg" && "text-red-700")}>{value}</td>
    </tr>
  );
}

function KV({ k, v, tone, strong, hint }: { k: string; v: string; tone?: "pos" | "neg"; strong?: boolean; hint?: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted">{k}{hint && <span className="block text-[11px] text-muted/70">{hint}</span>}</span>
      <span className={cn(strong ? "font-display text-xl" : "font-medium", tone === "pos" && "text-emerald-700", tone === "neg" && "text-red-700")}>{v}</span>
    </div>
  );
}
