"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ExternalLink, Search } from "lucide-react";
import { Badge, EmptyState } from "@/components/admin/ui";
import { cn, formatPrice } from "@/lib/utils";
import type { BusinessRow } from "@/services/platform-stats";
import { STATE_TONES } from "./shared";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "trial", label: "Trial" },
  { key: "attention", label: "Needs attention" },
  { key: "suspended", label: "Suspended" },
] as const;

export function BusinessTable({ rows, currency }: { rows: BusinessRow[]; currency: string }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const m = (n: number) => formatPrice(n, currency);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (needle && ![r.name, r.slug, r.owner?.email, r.owner?.phone, r.template].some((v) => v?.toLowerCase().includes(needle))) return false;
      if (filter === "active") return r.status === "active";
      if (filter === "trial") return r.status === "trial";
      if (filter === "suspended") return r.status === "suspended" || r.status === "cancelled";
      if (filter === "attention") return ["trial_expired", "overdue", "due_soon"].includes(r.state.key);
      return true;
    });
  }, [rows, q, filter]);

  if (!rows.length) {
    return (
      <EmptyState
        title="No businesses yet"
        text="Create your first business — it gets its own storefront, admin panel and address instantly."
        action={<Link href="/console/businesses/new" className="btn-primary">New Business</Link>}
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, address, owner…" className="input pl-9" />
        </div>
        <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-xl border border-line bg-white p-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn("shrink-0 rounded-lg px-3 py-1.5 text-xs transition", filter === f.key ? "bg-cocoa text-ivory" : "text-cocoa-light hover:bg-blush-50")}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-blush-50/60 text-left text-[11px] uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3">Business</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Products</th>
              <th className="px-4 py-3 text-right">Sales · 30d</th>
              <th className="px-4 py-3 text-right">Lifetime</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {shown.map((r) => (
              <tr key={r._id} className="hover:bg-blush-50/40">
                <td className="px-4 py-3">
                  <Link href={`/console/businesses/${r._id}`} className="font-medium hover:text-rose">{r.name}</Link>
                  <p className="text-xs text-muted">{r.url.replace(/^https?:\/\//, "")} · {r.template}</p>
                </td>
                <td className="px-4 py-3">{r.plan?.name ?? <span className="text-muted">—</span>}</td>
                <td className="px-4 py-3"><Badge tone={STATE_TONES[r.state.key]}>{r.state.label}</Badge></td>
                <td className="px-4 py-3 text-right">{r.products}</td>
                <td className="px-4 py-3 text-right">
                  {m(r.last30.revenue)}
                  <p className="text-xs text-muted">{r.last30.orders} orders</p>
                </td>
                <td className="px-4 py-3 text-right">{m(r.lifetime.revenue)}</td>
                <td className="px-4 py-3 text-right">
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex rounded-lg p-2 text-muted hover:bg-blush-100 hover:text-rose" aria-label={`Open ${r.name} store`}>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {shown.length === 0 && <p className="p-8 text-center text-sm text-muted">No businesses match.</p>}
      </div>
    </div>
  );
}
