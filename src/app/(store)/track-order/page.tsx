import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Package } from "lucide-react";

export const metadata: Metadata = { title: "Track Your Order" };

async function track(formData: FormData) {
  "use server";
  const orderNumber = String(formData.get("orderNumber") ?? "").trim().toUpperCase().replace(/^#/, "");
  const phone = String(formData.get("phone") ?? "").trim();
  if (!orderNumber || !phone) redirect("/track-order?error=1");
  redirect(`/order/${encodeURIComponent(orderNumber)}?phone=${encodeURIComponent(phone)}`);
}

export default async function TrackOrderPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <div className="container-x flex min-h-[60vh] items-center justify-center py-16">
      <div className="card w-full max-w-md p-8 text-center sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blush-100">
          <Package className="h-7 w-7 text-rose" strokeWidth={1.5} />
        </div>
        <h1 className="heading-display mt-5 text-4xl">Track Your Order</h1>
        <p className="mt-2 text-sm text-muted">Enter your order number and the phone number used at checkout.</p>
        <form action={track} className="mt-8 space-y-4 text-left">
          <div>
            <label className="label" htmlFor="orderNumber">Order Number</label>
            <input id="orderNumber" name="orderNumber" required placeholder="e.g. OR10001" className="input uppercase" />
          </div>
          <div>
            <label className="label" htmlFor="phone">Phone Number</label>
            <input id="phone" name="phone" required inputMode="tel" placeholder="01XXXXXXXXX" className="input" />
          </div>
          {error && <p className="text-xs text-red-600">Please fill in both fields.</p>}
          <button className="btn-primary w-full">Track Order</button>
        </form>
      </div>
    </div>
  );
}
