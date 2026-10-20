import Link from "next/link";
import type { FilterQuery } from "mongoose";
import { Search } from "lucide-react";
import { Badge, EmptyState, PageHeader } from "@/components/admin/ui";
import { STATUS_TONES } from "@/components/admin/tones";
import { connectDB } from "@/lib/db";
import { serialize } from "@/lib/serialize";
import { cn, escapeRegex, formatDate, formatPrice } from "@/lib/utils";
import { ORDER_STATUSES, Order, type OrderDoc } from "@/models/Order";
import { loadSettings } from "@/services/settings";
import { PAYMENT_LABELS, type OrderDTO } from "@/types";

const PAGE_SIZE = 25;

export default async function OrdersAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; payment?: string; page?: string }>;
}) {
  const sp = await searchParams;
  await connectDB();
  const page = Math.max(1, Number(sp.page) || 1);
  const filter: FilterQuery<OrderDoc> = {};
  if (sp.status && (ORDER_STATUSES as readonly string[]).includes(sp.status)) filter.status = sp.status;
  if (sp.payment) filter.paymentStatus = sp.payment;
  if (sp.q) {
    const rx = new RegExp(escapeRegex(sp.q.trim()), "i");
    filter.$or = [{ orderNumber: rx }, { "customer.name": rx }, { "customer.phone": rx }, { transactionId: rx }];
  }

  const [docs, total, settings] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).lean(),
    Order.countDocuments(filter),
    loadSettings(),
  ]);
  const orders = serialize<OrderDTO[]>(docs);
  const pages = Math.ceil(total / PAGE_SIZE);
  const qs = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(Object.entries({ ...sp, ...patch }).filter(([, v]) => v) as [string, string][]);
    return `/admin/orders?${next.toString()}`;
  };

  return (
    <div>
      <PageHeader title="Orders" description={`${total} order(s)${sp.status ? ` · ${sp.status}` : ""}`} />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {["", ...ORDER_STATUSES].map((s) => (
            <Link
              key={s || "all"}
              href={qs({ status: s || undefined, page: undefined })}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-xs capitalize transition",
                (sp.status ?? "") === s ? "border-cocoa bg-cocoa text-ivory" : "border-line bg-white hover:border-rose",
              )}
            >
              {s || "All"}
            </Link>
          ))}
        </div>
        <form className="relative w-full lg:max-w-xs">
          {sp.status && <input type="hidden" name="status" value={sp.status} />}
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input name="q" defaultValue={sp.q} placeholder="Order #, name, phone, TrxID…" className="input bg-white pl-10" />
        </form>
      </div>

      {orders.length === 0 ? (
        <EmptyState title="No orders found" text={sp.q || sp.status ? "Try a different filter." : "When customers place orders they will appear here."} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full min-w-[880px] text-sm">
            <thead className="border-b border-line bg-blush-50/60 text-left text-[11px] uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orders.map((o) => (
                <tr key={o._id} className="transition hover:bg-blush-50/40">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${o._id}`} className="font-semibold text-rose hover:underline">#{o.orderNumber}</Link>
                    <p className="text-xs text-muted">{formatDate(o.createdAt, { dateStyle: "medium", timeStyle: "short" })}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{o.customer.name}</p>
                    <p className="text-xs text-muted">{o.customer.phone} · {o.shipping.city}</p>
                  </td>
                  <td className="px-4 py-3 text-muted">{o.items.reduce((s, i) => s + i.quantity, 0)} pcs</td>
                  <td className="px-4 py-3">
                    <p className="text-xs">{PAYMENT_LABELS[o.paymentMethod]}</p>
                    <Badge tone={STATUS_TONES[o.paymentStatus]}>{o.paymentStatus}</Badge>
                  </td>
                  <td className="px-4 py-3"><Badge tone={STATUS_TONES[o.status]}>{o.status}</Badge></td>
                  <td className="px-4 py-3 text-right font-semibold">{formatPrice(o.total, settings.currencySymbol)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link key={p} href={qs({ page: String(p) })} className={cn("flex h-9 w-9 items-center justify-center rounded-full border text-sm", p === page ? "border-cocoa bg-cocoa text-ivory" : "border-line bg-white")}>
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
