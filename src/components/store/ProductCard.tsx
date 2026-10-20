"use client";

import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import type { ProductDTO } from "@/types";
import { ASPECT_CLASS, useStore } from "./StoreContext";

export function ProductCard({ product, currency, priority }: { product: ProductDTO; currency: string; priority?: boolean }) {
  const [primary, secondary] = product.images;
  const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);
  const soldOut = product.variants.length > 0 && totalStock === 0;
  const onSale = product.discountPercent > 0;
  const { catalog } = useStore();

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className={`relative ${ASPECT_CLASS[catalog.imageAspect] ?? "aspect-[4/5]"} overflow-hidden rounded-2xl bg-blush-100`}>
        {primary ? (
          <>
            <Image
              src={primary}
              alt={product.name}
              fill
              priority={priority}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-all duration-700 group-hover:scale-105"
            />
            {secondary && (
              <Image
                src={secondary}
                alt=""
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center font-display text-4xl text-blush-300">{product.name.charAt(0)}</div>
        )}

        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {onSale && (
            <span className="rounded-full bg-rose px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
              −{product.discountPercent}%
            </span>
          )}
          {product.isNewArrival && (
            <span className="rounded-full bg-ivory/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-cocoa">
              New
            </span>
          )}
          {product.isBestSeller && (
            <span className="rounded-full bg-cocoa/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-ivory">
              Bestseller
            </span>
          )}
        </div>

        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-cream/60 backdrop-blur-[1px]">
            <span className="rounded-full bg-ivory px-4 py-2 text-xs uppercase tracking-widest">Sold Out</span>
          </div>
        )}

        <div className="absolute inset-x-3 bottom-3 translate-y-3 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          <span className="block rounded-full bg-ivory/95 py-2.5 text-center text-[11px] uppercase tracking-[0.2em] text-cocoa backdrop-blur">
            View Details
          </span>
        </div>
      </div>
      <div className="mt-4 px-1">
        {product.category?.name && <p className="text-[10px] uppercase tracking-[0.25em] text-muted">{product.category.name}</p>}
        <h3 className="mt-1 font-display text-lg leading-snug text-cocoa transition group-hover:text-rose">{product.name}</h3>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-sm font-medium text-cocoa">{formatPrice(product.salePrice || product.price, currency)}</span>
          {onSale && <span className="text-xs text-muted line-through">{formatPrice(product.price, currency)}</span>}
        </div>
      </div>
    </Link>
  );
}

export function ProductGrid({ products, currency }: { products: ProductDTO[]; currency: string }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p, i) => (
        <ProductCard key={p._id} product={p} currency={currency} priority={i < 4} />
      ))}
    </div>
  );
}
