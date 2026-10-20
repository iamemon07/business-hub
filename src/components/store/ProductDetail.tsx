"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Minus, Plus, ShieldCheck, Truck, Wallet } from "lucide-react";
import { useCart } from "@/store/cart";
import { cn } from "@/lib/utils";
import type { ProductDTO } from "@/types";
import { ASPECT_CLASS, useStore } from "./StoreContext";

export function ProductDetail({ product, deliveryText }: { product: ProductDTO; deliveryText: string }) {
  const { money, catalog } = useStore();
  const label = catalog.variantLabel || "Option";
  const aspect = ASPECT_CLASS[catalog.imageAspect] ?? "aspect-[4/5]";
  const specs = (product.specs ?? []).filter((s) => s.key && s.value);
  const add = useCart((s) => s.add);
  const router = useRouter();
  const [active, setActive] = useState(0);
  const [size, setSize] = useState(() => (product.variants.length === 1 ? product.variants[0].size : ""));
  const [color, setColor] = useState(product.colors[0] ?? "");
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<"details" | "care" | "delivery">("details");

  const hasVariants = product.variants.length > 0;
  const variant = product.variants.find((v) => v.size === size);
  const stock = hasVariants ? (variant?.stock ?? 0) : 99;
  const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);
  const soldOut = hasVariants && totalStock === 0;
  const price = product.salePrice || product.price;
  const images = product.images.length ? product.images : [""];

  const tabs = useMemo(
    () => ({
      details: product.description || product.shortDescription || "",
      care: product.care || catalog.defaultCare || "Please contact us for care instructions.",
      delivery: deliveryText,
    }),
    [product, deliveryText, catalog.defaultCare],
  );

  const addToCart = (buyNow = false) => {
    if (hasVariants && !size) {
      toast.error(`Please select a ${label.toLowerCase()}`);
      return false;
    }
    if (stock < 1) {
      toast.error(`This ${label.toLowerCase()} is out of stock`);
      return false;
    }
    add({
      productId: product._id,
      slug: product.slug,
      name: product.name,
      image: product.images[0] ?? "",
      price,
      originalPrice: product.price,
      size: hasVariants ? size : "",
      color,
      quantity: qty,
      maxStock: stock,
    });
    if (buyNow) {
      useCart.getState().close();
      router.push("/checkout");
    } else {
      toast.success(`Added to your ${catalog.cartLabel.toLowerCase()}`);
    }
    return true;
  };

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
      {/* Gallery */}
      <div className="flex flex-col-reverse gap-4 sm:flex-row">
        {images.length > 1 && (
          <div className="no-scrollbar flex gap-3 overflow-x-auto sm:max-h-[640px] sm:flex-col sm:overflow-y-auto">
            {images.map((src, i) => (
              <button
                key={src + i}
                onClick={() => setActive(i)}
                className={cn(
                  `relative ${aspect} w-20 shrink-0 overflow-hidden rounded-xl border-2 transition`,
                  i === active ? "border-rose" : "border-transparent opacity-70 hover:opacity-100",
                )}
                aria-label={`View image ${i + 1}`}
              >
                <Image src={src} alt="" fill sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
        <div className={`relative ${aspect} flex-1 overflow-hidden rounded-3xl bg-blush-100`}>
          {images[active] ? (
            <Image key={images[active]} src={images[active]} alt={product.name} fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="animate-fade-in object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center font-display text-7xl text-blush-300">{product.name.charAt(0)}</div>
          )}
          {product.discountPercent > 0 && (
            <span className="absolute left-4 top-4 rounded-full bg-rose px-3 py-1.5 text-xs font-semibold text-white">
              −{product.discountPercent}% OFF
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="lg:py-4">
        {product.category && <p className="eyebrow mb-3">{product.category.name}</p>}
        <h1 className="heading-display text-4xl leading-tight sm:text-5xl">{product.name}</h1>
        <div className="mt-5 flex items-baseline gap-3">
          <span className="text-2xl font-medium">{money(price)}</span>
          {product.discountPercent > 0 && (
            <>
              <span className="text-lg text-muted line-through">{money(product.price)}</span>
              <span className="rounded-full bg-blush-100 px-3 py-1 text-xs font-medium text-rose-dark">
                Save {money(product.price - price)}
              </span>
            </>
          )}
        </div>
        {product.shortDescription && <p className="mt-6 leading-relaxed text-cocoa-light">{product.shortDescription}</p>}

        {specs.length > 0 && (
          <dl className="mt-6 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
            {specs.map((sp) => (
              <div key={sp.key} className="contents">
                <dt className="label mb-0 self-center">{sp.key}</dt>
                <dd className="text-cocoa">{sp.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {product.colors.length > 0 && (
          <div className="mt-8">
            <p className="label">
              Color: <span className="normal-case tracking-normal text-cocoa">{color}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {product.colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm transition",
                    c === color ? "border-cocoa bg-cocoa text-ivory" : "border-line hover:border-rose",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {hasVariants && (
          <div className="mt-8">
            {/* A single variant is pre-selected, so the picker only appears when there is a real choice. */}
            {product.variants.length > 1 && <p className="label">{label}</p>}
            <div className={cn("flex flex-wrap gap-2", product.variants.length === 1 && "hidden")}>
              {product.variants.map((v) => (
                <button
                  key={v.size}
                  onClick={() => {
                    setSize(v.size);
                    setQty(1);
                  }}
                  disabled={v.stock === 0}
                  className={cn(
                    "relative min-w-14 rounded-full border px-4 py-2.5 text-sm transition",
                    v.size === size ? "border-cocoa bg-cocoa text-ivory" : "border-line hover:border-rose",
                    v.stock === 0 && "cursor-not-allowed text-muted/50 line-through hover:border-line",
                  )}
                >
                  {v.size}
                </button>
              ))}
            </div>
            {variant && variant.stock > 0 && variant.stock <= 5 && (
              <p className="mt-3 text-xs text-rose-dark">Only {variant.stock} left — order soon</p>
            )}
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-full border border-line bg-ivory">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-3.5" aria-label="Decrease quantity">
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-8 text-center">{qty}</span>
            <button onClick={() => setQty((q) => Math.min(stock || 1, 20, q + 1))} className="p-3.5" aria-label="Increase quantity">
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <button onClick={() => addToCart(false)} disabled={soldOut} className="btn-outline flex-1 py-3.5">
            {soldOut ? "Sold Out" : `Add to ${catalog.cartLabel}`}
          </button>
        </div>
        <button onClick={() => addToCart(true)} disabled={soldOut} className="btn-primary mt-3 w-full py-4">
          Buy Now
        </button>

        <div className="mt-8 grid grid-cols-3 gap-3 rounded-2xl bg-blush-50 p-4 text-center text-[11px] text-cocoa-light">
          <div className="flex flex-col items-center gap-1.5"><Truck className="h-5 w-5 text-rose" strokeWidth={1.5} />Fast Delivery</div>
          <div className="flex flex-col items-center gap-1.5"><Wallet className="h-5 w-5 text-rose" strokeWidth={1.5} />Cash on Delivery</div>
          <div className="flex flex-col items-center gap-1.5"><ShieldCheck className="h-5 w-5 text-rose" strokeWidth={1.5} />Quality Checked</div>
        </div>

        <div className="mt-10">
          <div className="flex gap-6 border-b border-line">
            {(["details", "care", "delivery"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "-mb-px border-b-2 pb-3 text-xs uppercase tracking-[0.2em] transition",
                  tab === t ? "border-cocoa text-cocoa" : "border-transparent text-muted hover:text-cocoa",
                )}
              >
                {t === "care" ? catalog.careTabLabel : t}
              </button>
            ))}
          </div>
          <p className="whitespace-pre-line pt-5 text-sm leading-relaxed text-cocoa-light">{tabs[tab]}</p>
        </div>
      </div>
    </div>
  );
}
