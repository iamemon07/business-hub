"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useHydrated, useStore } from "@/components/store/StoreContext";
import { cartSubtotal, useCart } from "@/store/cart";
import { lineOptions } from "@/lib/utils";

export default function CartPage() {
  const { items, setQuantity, remove } = useCart();
  const { money, catalog } = useStore();
  const hydrated = useHydrated();

  if (!hydrated) return <div className="container-x min-h-[50vh] py-16" />;

  if (!items.length) {
    return (
      <div className="container-x flex min-h-[55vh] flex-col items-center justify-center py-16 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blush-100">
          <ShoppingBag className="h-10 w-10 text-rose" strokeWidth={1.5} />
        </div>
        <h1 className="heading-display mt-6 text-4xl">Your {catalog.cartLabel.toLowerCase()} is empty</h1>
        <p className="mt-2 text-sm text-muted">Let&apos;s find something you&apos;ll love.</p>
        <Link href="/shop" className="btn-primary mt-8">Continue Shopping</Link>
      </div>
    );
  }

  const subtotal = cartSubtotal(items);

  return (
    <div className="container-x py-12">
      <h1 className="heading-display mb-10 text-center text-5xl">Your {catalog.cartLabel}</h1>
      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        <ul className="divide-y divide-line border-y border-line">
          {items.map((item) => (
            <li key={item.key} className="flex gap-5 py-6">
              <Link href={`/product/${item.slug}`} className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-2xl bg-blush-100 sm:w-28">
                {item.image && <Image src={item.image} alt={item.name} fill sizes="112px" className="object-cover" />}
              </Link>
              <div className="flex flex-1 flex-col">
                <div className="flex justify-between gap-3">
                  <div>
                    <Link href={`/product/${item.slug}`} className="font-display text-xl hover:text-rose">{item.name}</Link>
                    <p className="mt-1 text-xs text-muted">{lineOptions(item.size, item.color)}</p>
                    <p className="mt-2 text-sm">
                      {money(item.price)}
                      {item.originalPrice > item.price && <span className="ml-2 text-xs text-muted line-through">{money(item.originalPrice)}</span>}
                    </p>
                  </div>
                  <button onClick={() => remove(item.key)} className="self-start text-muted hover:text-rose" aria-label="Remove">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between pt-4">
                  <div className="flex items-center rounded-full border border-line bg-ivory">
                    <button onClick={() => setQuantity(item.key, item.quantity - 1)} className="p-2.5" aria-label="Decrease"><Minus className="h-3 w-3" /></button>
                    <span className="w-7 text-center text-sm">{item.quantity}</span>
                    <button onClick={() => setQuantity(item.key, item.quantity + 1)} disabled={item.quantity >= item.maxStock} className="p-2.5 disabled:opacity-30" aria-label="Increase"><Plus className="h-3 w-3" /></button>
                  </div>
                  <span className="font-medium">{money(item.price * item.quantity)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="card h-fit p-6 lg:sticky lg:top-28">
          <h2 className="heading-display text-2xl">Order Summary</h2>
          <div className="mt-6 flex justify-between text-sm">
            <span className="text-muted">Subtotal</span>
            <span>{money(subtotal)}</span>
          </div>
          <div className="mt-3 flex justify-between text-sm">
            <span className="text-muted">Delivery</span>
            <span className="text-muted">At checkout</span>
          </div>
          <div className="my-5 h-px bg-line" />
          <div className="flex justify-between font-medium">
            <span>Estimated Total</span>
            <span>{money(subtotal)}</span>
          </div>
          <Link href="/checkout" className="btn-primary mt-6 w-full">Proceed to Checkout</Link>
          <Link href="/shop" className="mt-4 block text-center text-xs uppercase tracking-widest text-muted hover:text-rose">Continue Shopping</Link>
        </aside>
      </div>
    </div>
  );
}
