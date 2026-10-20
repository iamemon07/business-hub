import Image from "next/image";
import Link from "next/link";
import { isValidObjectId } from "mongoose";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Phone, Mail } from "lucide-react";
import { OrderActions } from "@/components/admin/OrderActions";
import { Badge, Panel } from "@/components/admin/ui";
import { STATUS_TONES } from "@/components/admin/tones";
import { Invoice } from "@/components/Invoice";
import { PrintButton } from "@/components/PrintButton";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { serialize } from "@/lib/serialize";
import { formatDate, formatPrice, lineOptions } from "@/lib/utils";
import { Order } from "@/models/Order";
import { loadSettings } from "@/services/settings";
import { PAYMENT_LABELS, STATUS_LABELS, type OrderDTO } from "@/types";

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidObjectId(id)) notFound();
  await connectDB();
  const [doc, settings, session] = await Promise.all([Order.findById(id).lean(), loadSettings(), getSession()]);
  if (!doc) notFound();
  const order = serialize<OrderDTO>(doc);
  const m = (n: number) => formatPrice(n, settings.currencySymbol);
  const cogs = order.items.reduce((s, i) => s + (i.unitCost || 0) * i.quantity, 0);
  const profit = order.subtotal - order.discount - cogs + order.shippingFee - (order.courierCost || 0);

  return (
    <div>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end print:hidden">
        <div>
          <Link href="/admin/orders" className="mb-3 inline-flex items-center gap-1 text-xs uppercase tracking-wider text-muted hover:text-rose">
            <ArrowLeft className="h-3.5 w-3.5" /> Orders
          </Link>
          <h1 className="flex flex-wrap items-center gap-3 font-display text-4xl">
            #{order.orderNumber}
            <Badge tone={STATUS_TONES[order.status]}>{order.status}</Badge>
            <Badge tone={STATUS_TONES[order.paymentStatus]}>{order.paymentStatus}</Badge>
          </h1>
          <p className="mt-1 text-sm text-muted">Placed {formatDate(order.createdAt, { dateStyle: "full", timeStyle: "short" })}</p>
        </div>
        <PrintButton className="btn-outline" label="Print Invoice" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px] print:block">
        <div className="space-y-6 print:hidden">
          <Panel title="Items">
            <ul className="divide-y divide-line">
              {order.items.map((i, idx) => (
                <li key={idx} className="flex items-center gap-4 py-3">
                  <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-blush-100">
                    {i.image && <Image src={i.image} alt="" fill sizes="48px" className="object-cover" unoptimized={!i.image.startsWith("/")} />}
                  </div>
                  <div className="flex-1 text-sm">
                    <p className="font-medium">{i.name}</p>
                    <p className="text-xs text-muted">{lineOptions(i.size, i.color)}</p>
                  </div>
                  <p className="text-sm text-muted">{i.quantity} × {m(i.unitPrice)}</p>
                  <p className="w-24 text-right text-sm font-semibold">{m(i.lineTotal)}</p>
                </li>
              ))}
            </ul>
            <dl className="ml-auto mt-4 max-w-xs space-y-1.5 border-t border-line pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{m(order.subtotal)}</dd></div>
              {order.discount > 0 && <div className="flex justify-between"><dt className="text-muted">Discount {order.couponCode && `(${order.couponCode})`}</dt><dd>−{m(order.discount)}</dd></div>}
              <div className="flex justify-between"><dt className="text-muted">Delivery ({order.shipping.zone})</dt><dd>{m(order.shippingFee)}</dd></div>
              <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd>{m(order.total)}</dd></div>
            </dl>
          </Panel>

          <div className="grid gap-6 md:grid-cols-2">
            <Panel title="Customer">
              <div className="space-y-2 text-sm">
                <p className="font-medium">{order.customer.name}</p>
                <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-rose" /><a href={`tel:${order.customer.phone}`} className="hover:underline">{order.customer.phone}</a></p>
                {order.customer.email && <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-rose" />{order.customer.email}</p>}
                <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-rose" />{order.shipping.address}{order.shipping.area && `, ${order.shipping.area}`}, {order.shipping.city}</p>
                {order.shipping.note && <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">Note: {order.shipping.note}</p>}
              </div>
            </Panel>
            <Panel title="Payment">
              <div className="space-y-2 text-sm">
                <p><span className="text-muted">Method:</span> {PAYMENT_LABELS[order.paymentMethod]}</p>
                {order.senderNumber && <p><span className="text-muted">Sender:</span> <span className="font-mono">{order.senderNumber}</span></p>}
                {order.transactionId && <p><span className="text-muted">TrxID:</span> <span className="font-mono font-semibold">{order.transactionId}</span></p>}
                <p><span className="text-muted">Est. delivery:</span> {formatDate(order.estimatedDelivery.from, { day: "numeric", month: "short" })} – {formatDate(order.estimatedDelivery.to, { day: "numeric", month: "short" })}</p>
                <p><span className="text-muted">Invoice email:</span> {order.invoiceSentAt ? `sent ${formatDate(order.invoiceSentAt)}` : "not sent"}</p>
              </div>
            </Panel>
          </div>

          {session?.role === "owner" && (
            <Panel title="Order Profit">
              <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                <div><p className="text-xs text-muted">Net sales</p><p className="font-display text-xl">{m(order.subtotal - order.discount)}</p></div>
                <div><p className="text-xs text-muted">Product cost</p><p className="font-display text-xl">{m(cogs)}</p></div>
                <div><p className="text-xs text-muted">Delivery (in − out)</p><p className="font-display text-xl">{m(order.shippingFee - (order.courierCost || 0))}</p></div>
                <div><p className="text-xs text-muted">Profit</p><p className={`font-display text-xl ${profit >= 0 ? "text-emerald-700" : "text-red-700"}`}>{m(profit)}</p></div>
              </div>
            </Panel>
          )}

          <Panel title="Timeline">
            <ol className="relative space-y-4 border-l border-line pl-6">
              {[...order.statusHistory].reverse().map((h, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[29px] top-1 h-3 w-3 rounded-full border-2 border-white bg-rose" />
                  <p className="text-sm font-medium">{STATUS_LABELS[h.status as OrderDTO["status"]] ?? h.status}</p>
                  <p className="text-xs text-muted">{formatDate(h.at, { dateStyle: "medium", timeStyle: "short" })}{h.note && ` · ${h.note}`}</p>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div className="space-y-6 print:hidden">
          <OrderActions order={order} />
        </div>

        <div className="hidden print:block">
          <Invoice order={order} settings={settings} />
        </div>
      </div>
    </div>
  );
}
