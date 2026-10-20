import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatPrice(amount: number, symbol = "৳") {
  return `${symbol}${Math.round(amount || 0).toLocaleString("en-US")}`;
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Price after the product-level discount percentage, rounded to whole currency units. */
export function discountedPrice(price: number, discountPercent = 0) {
  if (!discountPercent || discountPercent <= 0) return price;
  return Math.round(price * (1 - Math.min(discountPercent, 95) / 100));
}

/** Text logo lines; falls back to the store name split into a big first word and a small remainder. */
export function wordmarkOf(storeName: string, wordmark?: { main?: string; sub?: string }) {
  if (wordmark?.main) return { main: wordmark.main, sub: wordmark.sub ?? "" };
  const [first, ...rest] = storeName.trim().split(/s+/);
  return { main: (first ?? "").toUpperCase(), sub: rest.join(" ").toUpperCase() };
}

/** Default option name for single-variant products; not worth showing on line items. */
export const DEFAULT_OPTION = "Standard";

/** "Variant · Color" label for a cart/order line, skipping empty parts and the default option. */
export function lineOptions(option: string | undefined, color: string | undefined) {
  return [option !== DEFAULT_OPTION && option, color].filter(Boolean).join(" · ");
}

export function formatDate(d: string | Date, opts: Intl.DateTimeFormatOptions = { dateStyle: "medium" }) {
  return new Intl.DateTimeFormat("en-GB", opts).format(new Date(d));
}

export function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function toNumber(v: unknown, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
