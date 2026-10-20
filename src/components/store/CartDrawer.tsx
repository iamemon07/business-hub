"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { cartSubtotal, useCart } from "@/store/cart";
import { cn, lineOptions } from "@/lib/utils";
import { useHydrated, useStore } from "./StoreContext";

export function CartDrawer() {
  const { items, isOpen, close, setQuantity, remove } = useCart();
  const { money, freeShippingThreshold, catalog } = useStore();
  const cartLabel = catalog.cartLabel;
  const hydrated = useHydrated();
  const subtotal = cartSubtotal(items);
  const remaining = freeShippingThreshold > 0 ? Math.max(0, freeShippingThreshold - subtotal) : 0;

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, close]);

  if (!hydrated) return null;

  return (
    <div className={cn("fixed inset-0 z-50 print:hidden", isOpen ? "pointer-events-auto" : "pointer-events-none")} aria-hidden={!isOpen}>
      <div onClick={close} className={cn("absolute inset-0 bg-cocoa/30 transition-opacity duration-300", isOpen ? "opacity-100" : "opacity-0")} />
      <aside
        role="dialog"
        aria-label={`Your ${cartLabel.toLowerCase()}`}
        className={cn(
          "absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-cream shadow-2xl transition-transform duration-300",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <h2 className="heading-display text-2xl">Your {cartLabel}</h2>
          <button onClick={close} aria-label="Close" className="p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blush-100">
              <ShoppingBag className="h-8 w-8 text-rose" />
            </div>
            <p className="font-display text-2xl">Your {cartLabel.toLowerCase()} is empty</p>
            <p className="text-sm text-muted">Discover pieces made to feel like you.</p>
            <Link href="/shop" onClick={close} className="btn-primary mt-2">
              Start Shopping
            </Link>
          </div>
        ) : (
          <>
            {freeShippingThreshold > 0 && (
              <div className="border-b border-line bg-blush-50 px-6 py-3 text-center text-xs text-cocoa-light">
                {remaining > 0 ? (
                  <>Add <strong>{money(remaining)}</strong> more for free delivery</>
                ) : (
                  <>✨ You&apos;ve unlocked <strong>free delivery</strong></>
                )}
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-blush-200">
                  <div
                    className="h-full rounded-full bg-rose transition-all"
                    style={{ width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%` }}
                  />
                </div>
              </div>
            )}
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-6">
              {items.map((item) => (
                <li key={item.key} className="flex gap-4 py-5">
                  <Link href={`/product/${item.slug}`} onClick={close} className="relative h-28 w-22 shrink-0 overflow-hidden rounded-xl bg-blush-100">
                    {item.image && <Image src={item.image} alt={item.name} fill sizes="88px" className="object-cover" />}
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <div className="flex justify-between gap-2">
                      <Link href={`/product/${item.slug}`} onClick={close} className="font-display text-lg leading-tight hover:text-rose">
                        {item.name}
                      </Link>
                      <button onClick={() => remove(item.key)} aria-label="Remove" className="text-muted hover:text-rose">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {lineOptions(item.size, item.color)}
                    </p>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center rounded-full border border-line">
                        <button onClick={() => setQuantity(item.key, item.quantity - 1)} className="p-2" aria-label="Decrease">
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-sm">{item.quantity}</span>
                        <button
                          onClick={() => setQuantity(item.key, item.quantity + 1)}
                          disabled={item.quantity >= item.maxStock}
                          className="p-2 disabled:opacity-30"
                          aria-label="Increase"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="text-sm font-medium">{money(item.price * item.quantity)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-line bg-ivory px-6 py-5">
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-muted">Subtotal</span>
                <span className="font-semibold">{money(subtotal)}</span>
              </div>
              <p className="mb-4 text-xs text-muted">Delivery & discounts calculated at checkout.</p>
              <Link href="/checkout" onClick={close} className="btn-primary w-full">
                Checkout
              </Link>
              <Link href="/cart" onClick={close} className="mt-3 block text-center text-xs uppercase tracking-widest text-muted hover:text-rose">
                View {cartLabel}
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
