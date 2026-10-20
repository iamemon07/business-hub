import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Circle, PackageCheck, XCircle } from "lucide-react";
import { Invoice } from "@/components/Invoice";
import { PrintButton } from "@/components/PrintButton";
import { connectDB } from "@/lib/db";
import { runWithTenant } from "@/lib/tenant-context";
import { cn, formatDate } from "@/lib/utils";
import { findOrderForCustomer } from "@/services/orders";
import { getStore } from "@/lib/store";
import { STATUS_LABELS } from "@/types";

export async function generateMetadata({ params }: { params: Promise<{ orderNumber: string }> }): Promise<Metadata> {
  const { orderNumber } = await params;
  const { settings } = await getStore();
  // Browsers use the page title as the default "Save as PDF" file name.
  return { title: { absolute: `Invoice ${orderNumber.toUpperCase()} - ${settings.storeName}` }, robots: { index: false } };
}

const STEPS = ["pending", "confirmed", "processing", "shipped", "delivered"] as const;

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ phone?: string; placed?: string }>;
}) {
  const [{ orderNumber }, { phone, placed }] = await Promise.all([params, searchParams]);
  await connectDB();
  const { tenant, settings } = await getStore();
  const order = phone ? await runWithTenant(tenant.id, () => findOrderForCustomer(orderNumber, phone)) : null;

  if (!order) {
    return (
      <div className="container-x flex min-h-[50vh] flex-col items-center justify-center py-16 text-center">
        <h1 className="heading-display text-4xl">Order not found</h1>
        <p className="mt-3 text-sm text-muted">Please check your order number and phone number.</p>
        <Link href="/track-order" className="btn-primary mt-8">Track an Order</Link>
      </div>
    );
  }

  const cancelled = order.status === "cancelled" || order.status === "returned";
  const currentStep = STEPS.indexOf(order.status as (typeof STEPS)[number]);

  return (
    <div className="container-x max-w-4xl py-12 print:max-w-none print:p-0">
      {placed && (
        <div className="mb-10 animate-fade-up text-center print:hidden">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blush-100">
            <PackageCheck className="h-10 w-10 text-rose" strokeWidth={1.5} />
          </div>
          <h1 className="heading-display mt-6 text-4xl sm:text-5xl">Thank you, {order.customer.name.split(" ")[0]}!</h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-cocoa-light">
            Your order <strong>#{order.orderNumber}</strong> has been placed.
            {order.customer.email ? " We've emailed your invoice." : ""} We&apos;ll call you shortly to confirm.
          </p>
          <p className="mt-4 font-script text-3xl text-rose">{settings.tagline}</p>
        </div>
      )}

      {/* Tracking */}
      <section className="card mb-8 p-6 sm:p-8 print:hidden">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Order Status</p>
            <p className="font-display text-3xl">{STATUS_LABELS[order.status]}</p>
          </div>
          {!cancelled && (
            <p className="text-sm text-cocoa-light">
              Arriving <strong>{formatDate(order.estimatedDelivery.from, { day: "numeric", month: "short" })} – {formatDate(order.estimatedDelivery.to, { day: "numeric", month: "short" })}</strong>
            </p>
          )}
        </div>
        {cancelled ? (
          <div className="flex items-center gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-800">
            <XCircle className="h-5 w-5" /> This order was {order.status}. Contact us if you have questions.
          </div>
        ) : (
          <ol className="grid grid-cols-5 gap-2">
            {STEPS.map((s, i) => {
              const done = i <= currentStep;
              return (
                <li key={s} className="flex flex-col items-center text-center">
                  <div className="relative flex w-full items-center justify-center">
                    {i > 0 && <span className={cn("absolute right-1/2 top-1/2 h-0.5 w-full -translate-y-1/2", i <= currentStep ? "bg-rose" : "bg-line")} />}
                    {done ? <CheckCircle2 className="relative h-7 w-7 bg-ivory text-rose" /> : <Circle className="relative h-7 w-7 bg-ivory text-line" />}
                  </div>
                  <span className={cn("mt-2 text-[11px] uppercase tracking-wider", done ? "text-cocoa" : "text-muted")}>{STATUS_LABELS[s]}</span>
                </li>
              );
            })}
          </ol>
        )}
        {order.trackingCode && <p className="mt-6 text-sm">Courier tracking code: <span className="font-mono font-semibold">{order.trackingCode}</span></p>}
      </section>

      <Invoice order={order} settings={settings} />

      <div className="mt-8 flex flex-wrap justify-center gap-3 print:hidden">
        <PrintButton />
        <Link href="/shop" className="btn-primary">Continue Shopping</Link>
      </div>
    </div>
  );
}
