import Image from "next/image";
import { formatDate, formatPrice, lineOptions } from "@/lib/utils";
import { PAYMENT_LABELS, type OrderDTO, type SettingsDTO } from "@/types";

/** Print-friendly invoice used by the customer order page and admin order detail. */
export function Invoice({ order, settings }: { order: OrderDTO; settings: SettingsDTO }) {
  const m = (n: number) => formatPrice(n, settings.currencySymbol);
  return (
    <div id="invoice" className="card overflow-hidden print:shadow-none">
      <div className="flex flex-col justify-between gap-6 border-b border-line bg-blush-50 p-6 sm:flex-row sm:items-center sm:p-8 print:bg-white">
        <div className="flex items-center gap-4">
          <Image src={settings.logo} alt={settings.storeName} width={64} height={64} className="rounded-full" />
          <div>
            <p className="font-display text-2xl tracking-[0.2em]">{settings.storeName.toUpperCase()}</p>
            <p className="text-xs text-muted">{settings.address}</p>
            <p className="text-xs text-muted">{settings.phone} · {settings.email}</p>
          </div>
        </div>
        <div className="sm:text-right">
          <p className="eyebrow">Invoice</p>
          <p className="font-display text-3xl">#{order.orderNumber}</p>
          <p className="text-xs text-muted">{formatDate(order.createdAt, { dateStyle: "long" })}</p>
        </div>
      </div>

      <div className="grid gap-6 p-6 text-sm sm:grid-cols-3 sm:p-8">
        <div>
          <p className="label">Bill & Ship To</p>
          <p className="font-medium">{order.customer.name}</p>
          <p className="text-cocoa-light">{order.customer.phone}</p>
          {order.customer.email && <p className="text-cocoa-light">{order.customer.email}</p>}
          <p className="mt-1 text-cocoa-light">
            {order.shipping.address}
            {order.shipping.area && `, ${order.shipping.area}`}, {order.shipping.city}
          </p>
        </div>
        <div>
          <p className="label">Payment</p>
          <p className="font-medium">{PAYMENT_LABELS[order.paymentMethod]}</p>
          <p className="capitalize text-cocoa-light">Status: {order.paymentStatus}</p>
          {order.transactionId && <p className="font-mono text-xs text-cocoa-light">TrxID: {order.transactionId}</p>}
        </div>
        <div>
          <p className="label">Estimated Delivery</p>
          <p className="font-medium">
            {formatDate(order.estimatedDelivery.from, { day: "numeric", month: "short" })} –{" "}
            {formatDate(order.estimatedDelivery.to, { day: "numeric", month: "short", year: "numeric" })}
          </p>
          <p className="text-cocoa-light">Working days, excluding holidays</p>
        </div>
      </div>

      <div className="overflow-x-auto px-6 sm:px-8">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b-2 border-blush-200 text-left text-[11px] uppercase tracking-wider text-muted">
              <th className="pb-3 font-medium">Item</th>
              <th className="pb-3 text-center font-medium">Qty</th>
              <th className="pb-3 text-right font-medium">Price</th>
              <th className="pb-3 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((i, idx) => (
              <tr key={idx} className="border-b border-line">
                <td className="py-3">
                  <p className="font-medium">{i.name}</p>
                  <p className="text-xs text-muted">{lineOptions(i.size, i.color)}</p>
                </td>
                <td className="py-3 text-center">{i.quantity}</td>
                <td className="py-3 text-right">{m(i.unitPrice)}</td>
                <td className="py-3 text-right font-medium">{m(i.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end p-6 sm:p-8">
        <dl className="w-full max-w-xs space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{m(order.subtotal)}</dd></div>
          {order.discount > 0 && (
            <div className="flex justify-between"><dt className="text-muted">Discount {order.couponCode && `(${order.couponCode})`}</dt><dd>−{m(order.discount)}</dd></div>
          )}
          <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd>{order.shippingFee ? m(order.shippingFee) : "Free"}</dd></div>
          <div className="flex justify-between border-t border-line pt-3 text-lg font-semibold"><dt>Total</dt><dd>{m(order.total)}</dd></div>
        </dl>
      </div>

      {settings.invoice.footerNote && (
        <p className="border-t border-line bg-blush-50 px-6 py-4 text-center text-xs text-muted sm:px-8 print:bg-white">
          {settings.invoice.footerNote}
        </p>
      )}
    </div>
  );
}
