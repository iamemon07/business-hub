"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";
import type { CatalogDTO } from "@/types";

type StoreCtx = {
  currency: string;
  freeShippingThreshold: number;
  /** The business's catalog vocabulary (variant label, nouns, image ratio…). */
  catalog: CatalogDTO;
};

const DEFAULT_CATALOG: CatalogDTO = {
  variantLabel: "Option",
  variantPresets: [],
  specFields: [],
  filterSpec: "",
  filterValues: [],
  itemNoun: "item",
  itemNounPlural: "items",
  cartLabel: "Cart",
  careTabLabel: "Details & Care",
  defaultCare: "",
  imageAspect: "4/5",
};

const Ctx = createContext<StoreCtx>({ currency: "৳", freeShippingThreshold: 0, catalog: DEFAULT_CATALOG });

export function StoreProvider({ value, children }: { value: StoreCtx; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  return { ...ctx, money: (n: number) => formatPrice(n, ctx.currency) };
}

/** Tailwind class for the business's product image ratio (literal strings so Tailwind generates them). */
export const ASPECT_CLASS: Record<CatalogDTO["imageAspect"], string> = {
  "3/4": "aspect-[3/4]",
  "4/5": "aspect-[4/5]",
  "1/1": "aspect-square",
};

/** True after the first client render — avoids hydration mismatch for localStorage-backed UI. */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
