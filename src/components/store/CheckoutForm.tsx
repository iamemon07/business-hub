"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, Copy, Loader2, Lock, Tag } from "lucide-react";
import { useCart } from "@/store/cart";
import { cn, lineOptions } from "@/lib/utils";
import { useHydrated, useStore } from "./StoreContext";

type Method = { id: "cod" | "bkash" | "nagad" | "rocket" | "bank"; label: string; instructions: string; number: string; accountType: string };
type Shipping = { insideLabel: string; outsideLabel: string; insideFee: number; outsideFee: number; minDays: number; maxDays: number };
type Quote = {
  lines: { productId: string; size: string; available: boolean; unitPrice: number; stock: number; issue: string }[];
  subtotal: number;
  discount: number;
  appliedCoupon: string;
  couponError: string;
  shippingFee: number;
  total: number;
};

const WALLETS = ["bkash", "nagad", "rocket"];

export function CheckoutForm({ methods, shipping }: { methods: Method[]; shipping: Shipping }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const { money, catalog } = useStore();
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);

  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", city: "", area: "", note: "" });
  const [zone, setZone] = useState<"inside" | "outside">("inside");
  const [method, setMethod] = useState<Method["id"]>(methods[0]?.id ?? "cod");
  const [trx, setTrx] = useState({ transactionId: "", senderNumber: "" });
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const payload = useMemo(
    () => items.map((i) => ({ productId: i.productId, size: i.size, color: i.color, quantity: i.quantity })),
    [items],
  );

  // Live, server-authoritative pricing.
  useEffect(() => {
    if (!hydrated || !payload.length) return;
    const ctrl = new AbortController();
    setQuoting(true);
    const t = setTimeout(() => {
      fetch("/api/cart/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payload, zone, couponCode: coupon }),
        signal: ctrl.signal,
      })
        .then((r) => r.json())
        .then((res) => {
          if (res.success) {
            setQuote(res.data);
            if (coupon && res.data.couponError) {
              toast.error(res.data.couponError);
              setCoupon("");
            }
          }
        })
        .catch(() => {})
        .finally(() => setQuoting(false));
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [payload, zone, coupon, hydrated]);

  if (!hydrated) return <div className="min-h-[50vh]" />;

  if (!items.length) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <p className="font-display text-3xl">Your {catalog.cartLabel.toLowerCase()} is empty</p>
        <Link href="/shop" className="btn-primary mt-6">Shop Now</Link>
      </div>
    );
  }

  const selected = methods.find((m) => m.id === method);
  const issues = quote?.lines.filter((l) => !l.available) ?? [];
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = "Please enter your full name";
    if (!/^(\+?88)?01[3-9]\d{8}$/.test(form.phone.replace(/[\s-]/g, ""))) e.phone = "Enter a valid mobile number (01XXXXXXXXX)";
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email";
    if (form.address.trim().length < 5) e.address = "Please enter your full address";
    if (form.city.trim().length < 2) e.city = "City / district is required";
    if (WALLETS.includes(method)) {
      if (!trx.senderNumber.trim()) e.senderNumber = "Required";
      if (!trx.transactionId.trim()) e.transactionId = "Required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please check the highlighted fields");
      return;
    }
    if (issues.length) {
      toast.error(`Some items are unavailable — please update your ${catalog.cartLabel.toLowerCase()}`);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { name: form.name, phone: form.phone, email: form.email },
          shipping: { address: form.address, city: form.city, area: form.area, zone, note: form.note },
          items: payload,
          couponCode: coupon,
          paymentMethod: method,
          ...(WALLETS.includes(method) ? trx : {}),
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Could not place order");
      clear();
      router.replace(`/order/${json.data.orderNumber}?phone=${encodeURIComponent(json.data.phone)}&placed=1`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not place order");
      setSubmitting(false);
    }
  };

  const field = (k: keyof typeof form, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label className="label" htmlFor={k}>{label}</label>
      <input id={k} value={form[k]} onChange={set(k)} className={cn("input", errors[k] && "border-red-400")} {...props} />
      {errors[k] && <p className="mt-1 text-xs text-red-600">{errors[k]}</p>}
    </div>
  );

  return (
    <form onSubmit={placeOrder} className="grid gap-10 lg:grid-cols-[1fr_420px]" noValidate>
      <div className="space-y-8">
        <section className="card p-6 sm:p-8">
          <h2 className="heading-display mb-6 text-2xl">Contact Details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {field("name", "Full Name *", { autoComplete: "name" })}
            {field("phone", "Mobile Number *", { autoComplete: "tel", inputMode: "tel", placeholder: "01XXXXXXXXX" })}
            <div className="sm:col-span-2">{field("email", "Email (for invoice)", { type: "email", autoComplete: "email", placeholder: "you@example.com" })}</div>
          </div>
        </section>

        <section className="card p-6 sm:p-8">
          <h2 className="heading-display mb-6 text-2xl">Delivery Address</h2>
          <div className="mb-5 grid grid-cols-2 gap-3">
            {(["inside", "outside"] as const).map((z) => (
              <button
                type="button"
                key={z}
                onClick={() => setZone(z)}
                className={cn(
                  "rounded-2xl border p-4 text-left transition",
                  zone === z ? "border-cocoa bg-blush-50 ring-1 ring-cocoa" : "border-line hover:border-rose",
                )}
              >
                <p className="text-sm font-medium">{z === "inside" ? shipping.insideLabel : shipping.outsideLabel}</p>
                <p className="text-xs text-muted">{money(z === "inside" ? shipping.insideFee : shipping.outsideFee)}</p>
              </button>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">{field("address", "Full Address *", { autoComplete: "street-address", placeholder: "House, road, block…" })}</div>
            {field("area", "Area / Thana", { placeholder: "e.g. Dhanmondi" })}
            {field("city", "City / District *", { autoComplete: "address-level2", placeholder: "e.g. Dhaka" })}
            <div className="sm:col-span-2">
              <label className="label" htmlFor="note">Order Note (optional)</label>
              <textarea id="note" value={form.note} onChange={set("note")} rows={2} className="input" placeholder="Any special instructions" />
            </div>
          </div>
        </section>

        <section className="card p-6 sm:p-8">
          <h2 className="heading-display mb-6 text-2xl">Payment Method</h2>
          <div className="space-y-3">
            {methods.map((m) => (
              <label
                key={m.id}
                className={cn(
                  "flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition",
                  method === m.id ? "border-cocoa bg-blush-50 ring-1 ring-cocoa" : "border-line hover:border-rose",
                )}
              >
                <input type="radio" name="payment" value={m.id} checked={method === m.id} onChange={() => setMethod(m.id)} className="accent-cocoa" />
                <span className="text-sm font-medium">{m.label}</span>
              </label>
            ))}
          </div>

          {selected && (
            <div className="mt-5 animate-fade-in rounded-2xl bg-blush-50 p-5 text-sm">
              {WALLETS.includes(selected.id) && selected.number && (
                <div className="mb-4 flex items-center justify-between rounded-xl bg-ivory p-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted">{selected.label} {selected.accountType}</p>
                    <p className="mt-1 font-mono text-lg font-semibold tracking-wider">{selected.number}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(selected.number);
                      toast.success("Number copied");
                    }}
                    className="btn-soft px-3 py-2"
                  >
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </button>
                </div>
              )}
              {WALLETS.includes(selected.id) && quote && (
                <p className="mb-3">Send <strong>{money(quote.total)}</strong> to the number above.</p>
              )}
              {selected.instructions && <p className="whitespace-pre-line text-cocoa-light">{selected.instructions}</p>}
              {WALLETS.includes(selected.id) && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label">Your {selected.label} Number *</label>
                    <input
                      value={trx.senderNumber}
                      onChange={(e) => setTrx((t) => ({ ...t, senderNumber: e.target.value }))}
                      className={cn("input", errors.senderNumber && "border-red-400")}
                      inputMode="tel"
                      placeholder="01XXXXXXXXX"
                    />
                  </div>
                  <div>
                    <label className="label">Transaction ID *</label>
                    <input
                      value={trx.transactionId}
                      onChange={(e) => setTrx((t) => ({ ...t, transactionId: e.target.value.toUpperCase() }))}
                      className={cn("input font-mono", errors.transactionId && "border-red-400")}
                      placeholder="e.g. 8N7A6D5E4F"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Summary */}
      <aside className="card h-fit p-6 sm:p-8 lg:sticky lg:top-28">
        <h2 className="heading-display text-2xl">Order Summary</h2>
        <ul className="mt-6 max-h-72 space-y-4 overflow-y-auto pr-1">
          {items.map((i) => {
            const line = quote?.lines.find((l) => l.productId === i.productId && l.size === i.size);
            return (
              <li key={i.key} className="flex gap-3">
                <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-blush-100">
                  {i.image && <Image src={i.image} alt={i.name} fill sizes="64px" className="object-cover" />}
                  <span className="absolute -right-0 -top-0 flex h-5 w-5 items-center justify-center rounded-bl-lg bg-cocoa text-[10px] text-ivory">{i.quantity}</span>
                </div>
                <div className="flex-1 text-sm">
                  <p className="font-medium leading-tight">{i.name}</p>
                  <p className="text-xs text-muted">{lineOptions(i.size, i.color)}</p>
                  {line?.issue && <p className="mt-1 text-xs font-medium text-red-600">{line.issue}</p>}
                </div>
                <p className="text-sm">{money((line?.unitPrice ?? i.price) * i.quantity)}</p>
              </li>
            );
          })}
        </ul>

        <div className="mt-6">
          {coupon && quote?.appliedCoupon ? (
            <div className="flex items-center justify-between rounded-xl bg-blush-50 px-4 py-3 text-sm">
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-green-700" /> {quote.appliedCoupon} applied</span>
              <button type="button" onClick={() => { setCoupon(""); setCouponInput(""); }} className="text-xs text-muted underline">Remove</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="Coupon code"
                  className="input pl-10"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      setCoupon(couponInput.trim());
                    }
                  }}
                />
              </div>
              <button type="button" onClick={() => setCoupon(couponInput.trim())} className="btn-soft px-5">Apply</button>
            </div>
          )}
        </div>

        <dl className={cn("mt-6 space-y-3 text-sm transition-opacity", quoting && "opacity-60")}>
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{money(quote?.subtotal ?? 0)}</dd></div>
          {!!quote?.discount && (
            <div className="flex justify-between text-green-800"><dt>Discount</dt><dd>−{money(quote.discount)}</dd></div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted">Delivery</dt>
            <dd>{quote?.shippingFee === 0 ? "Free" : money(quote?.shippingFee ?? 0)}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-4 text-lg font-semibold">
            <dt>Total</dt>
            <dd>{money(quote?.total ?? 0)}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-muted">
          Estimated delivery in {shipping.minDays}–{shipping.maxDays} working days after your order.
        </p>
        <button type="submit" disabled={submitting || !quote || issues.length > 0} className="btn-primary mt-6 w-full py-4">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
          {submitting ? "Placing Order…" : `Place Order${quote ? ` · ${money(quote.total)}` : ""}`}
        </button>
      </aside>
    </form>
  );
}
