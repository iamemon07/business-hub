"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most Popular" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "discount", label: "Biggest Discount" },
];
const FILTERS = [
  { value: "", label: "All" },
  { value: "new", label: "New Arrivals" },
  { value: "best", label: "Best Sellers" },
  { value: "sale", label: "On Sale" },
];

export function ShopFilters({
  categories,
  total,
  filter,
  nouns,
  children,
}: {
  categories: { name: string; slug: string }[];
  total: number;
  /** The business's spec filter (e.g. Material → Ceramic, Wood…); null hides it. */
  filter: { label: string; values: string[] } | null;
  nouns: { one: string; many: string };
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [min, setMin] = useState(params.get("min") ?? "");
  const [max, setMax] = useState(params.get("max") ?? "");

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    next.delete("page");
    startTransition(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }));
  };

  const current = {
    category: params.get("category") ?? "",
    filter: params.get("filter") ?? "",
    spec: params.get("spec") ?? "",
    sort: params.get("sort") ?? "newest",
  };
  const activeCount = [current.category, current.filter, current.spec, params.get("min"), params.get("max"), params.get("q")].filter(Boolean).length;

  const panel = (
    <div className="space-y-8">
      <div>
        <h4 className="eyebrow mb-4">Category</h4>
        <div className="flex flex-col gap-2">
          {[{ name: "All Categories", slug: "" }, ...categories].map((c) => (
            <button
              key={c.slug || "all"}
              onClick={() => update({ category: c.slug || null })}
              className={cn("text-left text-sm transition hover:text-rose", current.category === c.slug ? "font-medium text-rose" : "text-cocoa-light")}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h4 className="eyebrow mb-4">Collection</h4>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value || "all"}
              onClick={() => update({ filter: f.value || null })}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs transition",
                current.filter === f.value ? "border-cocoa bg-cocoa text-ivory" : "border-line hover:border-rose",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      {filter && filter.values.length > 0 && (
        <div>
          <h4 className="eyebrow mb-4">{filter.label}</h4>
          <div className="flex flex-wrap gap-2">
            {filter.values.map((s) => (
              <button
                key={s}
                onClick={() => update({ spec: current.spec === s ? null : s })}
                className={cn(
                  "min-w-11 rounded-full border px-3 py-1.5 text-xs transition",
                  current.spec === s ? "border-cocoa bg-cocoa text-ivory" : "border-line hover:border-rose",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
      <div>
        <h4 className="eyebrow mb-4">Price</h4>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            update({ min: min || null, max: max || null });
            setOpen(false);
          }}
          className="flex items-center gap-2"
        >
          <input value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))} placeholder="Min" inputMode="numeric" className="input py-2" />
          <span className="text-muted">–</span>
          <input value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))} placeholder="Max" inputMode="numeric" className="input py-2" />
          <button className="btn-soft px-4 py-2.5">Go</button>
        </form>
      </div>
      {activeCount > 0 && (
        <button
          onClick={() => {
            setMin("");
            setMax("");
            startTransition(() => router.push(pathname));
          }}
          className="text-xs uppercase tracking-widest text-rose underline underline-offset-4"
        >
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <>
      <div className="mb-8 flex items-center justify-between gap-4 border-b border-line pb-4">
        <button onClick={() => setOpen(true)} className="flex items-center gap-2 text-sm lg:hidden">
          <SlidersHorizontal className="h-4 w-4" /> Filters {activeCount > 0 && `(${activeCount})`}
        </button>
        <p className={cn("hidden text-sm text-muted lg:block", pending && "opacity-50")}>
          {total} {total === 1 ? nouns.one : nouns.many}
        </p>
        <select
          value={current.sort}
          onChange={(e) => update({ sort: e.target.value === "newest" ? null : e.target.value })}
          className="rounded-full border border-line bg-ivory px-4 py-2 text-sm outline-none focus:border-rose"
          aria-label="Sort products"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">{panel}</aside>
        <div className={cn("transition-opacity", pending && "opacity-60")}>{children}</div>
      </div>

      <div className={cn("fixed inset-0 z-50 lg:hidden", open ? "pointer-events-auto" : "pointer-events-none")}>
        <div onClick={() => setOpen(false)} className={cn("absolute inset-0 bg-cocoa/30 transition-opacity", open ? "opacity-100" : "opacity-0")} />
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-cream p-6 transition-transform duration-300",
            open ? "translate-y-0" : "translate-y-full",
          )}
        >
          <div className="mb-6 flex items-center justify-between">
            <h3 className="heading-display text-2xl">Filters</h3>
            <button onClick={() => setOpen(false)} aria-label="Close filters">
              <X className="h-5 w-5" />
            </button>
          </div>
          {panel}
          <button onClick={() => setOpen(false)} className="btn-primary mt-8 w-full">
            Show {total} results
          </button>
        </div>
      </div>
    </>
  );
}
