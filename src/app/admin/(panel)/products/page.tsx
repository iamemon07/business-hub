"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Flame, Loader2, Pencil, Plus, Search, Sparkles, Star, Trash2 } from "lucide-react";
import { Badge, EmptyState, PageHeader, Toggle } from "@/components/admin/ui";
import { api } from "@/lib/client-api";
import { cn, formatPrice } from "@/lib/utils";
import type { ProductDTO } from "@/types";

type Filter = "all" | "new" | "best" | "featured" | "sale" | "inactive" | "low";

export default function ProductsAdminPage() {
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const load = useCallback(async () => {
    try {
      setProducts(await api<ProductDTO[]>("/api/admin/products"));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const patch = async (p: ProductDTO, data: Partial<ProductDTO>) => {
    setProducts((list) => list.map((x) => (x._id === p._id ? { ...x, ...data } : x)));
    try {
      const updated = await api<ProductDTO>(`/api/admin/products/${p._id}`, { method: "PATCH", body: data });
      setProducts((list) => list.map((x) => (x._id === p._id ? { ...x, ...updated, category: x.category } : x)));
    } catch (e) {
      toast.error((e as Error).message);
      load();
    }
  };

  const remove = async (p: ProductDTO) => {
    if (!confirm(`Delete “${p.name}”? Consider marking it inactive instead to keep order history tidy.`)) return;
    try {
      await api(`/api/admin/products/${p._id}`, { method: "DELETE" });
      toast.success("Product deleted");
      setProducts((list) => list.filter((x) => x._id !== p._id));
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const discount = async (p: ProductDTO) => {
    const v = prompt(`Discount % for “${p.name}” (0 to remove):`, String(p.discountPercent || 0));
    if (v === null) return;
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0 || n > 95) return toast.error("Enter a number between 0 and 95");
    await patch(p, { discountPercent: n });
    toast.success(n ? `${n}% discount applied` : "Discount removed");
  };

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    return products.filter((p) => {
      if (needle && !`${p.name} ${p.sku}`.toLowerCase().includes(needle)) return false;
      const stock = p.variants.reduce((s, v) => s + v.stock, 0);
      switch (filter) {
        case "new": return p.isNewArrival;
        case "best": return p.isBestSeller;
        case "featured": return p.isFeatured;
        case "sale": return p.discountPercent > 0;
        case "inactive": return !p.active;
        case "low": return p.variants.length > 0 && p.variants.some((v) => v.stock <= 3);
        default: return stock >= 0;
      }
    });
  }, [products, q, filter]);

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: `All (${products.length})` },
    { key: "new", label: "New Arrivals" },
    { key: "best", label: "Best Sellers" },
    { key: "featured", label: "Featured" },
    { key: "sale", label: "On Sale" },
    { key: "low", label: "Low Stock" },
    { key: "inactive", label: "Hidden" },
  ];

  return (
    <div>
      <PageHeader
        title="Products"
        description="Manage your catalogue, highlight new arrivals & best sellers, and set discounts."
        actions={<Link href="/admin/products/new" className="btn-primary"><Plus className="h-4 w-4" /> Add Product</Link>}
      />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn("shrink-0 rounded-full border px-3.5 py-1.5 text-xs transition", filter === f.key ? "border-cocoa bg-cocoa text-ivory" : "border-line bg-white hover:border-rose")}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative w-full lg:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or SKU…" className="input bg-white pl-10" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-rose" /></div>
      ) : products.length === 0 ? (
        <EmptyState title="No products yet" text="Add your first product to start selling." action={<Link href="/admin/products/new" className="btn-primary">Add Product</Link>} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full min-w-[960px] text-sm">
            <thead className="border-b border-line bg-blush-50/60 text-left text-[11px] uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 text-center font-medium" title="New Arrival"><Sparkles className="mx-auto h-4 w-4" /></th>
                <th className="px-4 py-3 text-center font-medium" title="Best Seller"><Flame className="mx-auto h-4 w-4" /></th>
                <th className="px-4 py-3 text-center font-medium" title="Featured"><Star className="mx-auto h-4 w-4" /></th>
                <th className="px-4 py-3 font-medium">Visible</th>
                <th className="w-24 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((p) => {
                const stock = p.variants.reduce((s, v) => s + v.stock, 0);
                return (
                  <tr key={p._id} className={cn("transition hover:bg-blush-50/40", !p.active && "opacity-60")}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-lg bg-blush-100">
                          {p.images[0] && <Image src={p.images[0]} alt="" fill sizes="44px" className="object-cover" unoptimized={!p.images[0].startsWith("/")} />}
                        </div>
                        <div className="min-w-0">
                          <Link href={`/admin/products/${p._id}`} className="block truncate font-medium hover:text-rose">{p.name}</Link>
                          <p className="text-xs text-muted">{p.category?.name ?? "Uncategorised"}{p.sku && ` · ${p.sku}`} · {p.soldCount} sold</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => discount(p)} className="text-left" title="Click to set discount">
                        <span className="font-medium">{formatPrice(p.salePrice || p.price)}</span>
                        {p.discountPercent > 0 ? (
                          <span className="ml-2"><Badge tone="rose">−{p.discountPercent}%</Badge></span>
                        ) : (
                          <span className="ml-2 text-[11px] text-muted underline decoration-dotted">+ discount</span>
                        )}
                        {p.discountPercent > 0 && <p className="text-xs text-muted line-through">{formatPrice(p.price)}</p>}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      {p.variants.length ? (
                        <span className={cn(stock === 0 ? "text-red-600" : stock <= 5 ? "text-amber-700" : "")}>
                          {stock} <span className="text-xs text-muted">({p.variants.map((v) => `${v.size}:${v.stock}`).join(", ")})</span>
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center"><input type="checkbox" checked={p.isNewArrival} onChange={(e) => patch(p, { isNewArrival: e.target.checked })} className="h-4 w-4 accent-rose" aria-label="New arrival" /></td>
                    <td className="px-4 py-3 text-center"><input type="checkbox" checked={p.isBestSeller} onChange={(e) => patch(p, { isBestSeller: e.target.checked })} className="h-4 w-4 accent-rose" aria-label="Best seller" /></td>
                    <td className="px-4 py-3 text-center"><input type="checkbox" checked={p.isFeatured} onChange={(e) => patch(p, { isFeatured: e.target.checked })} className="h-4 w-4 accent-rose" aria-label="Featured" /></td>
                    <td className="px-4 py-3"><Toggle checked={p.active} onChange={(v) => patch(p, { active: v })} /></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Link href={`/admin/products/${p._id}`} className="rounded-lg p-2 text-muted hover:bg-blush-100 hover:text-cocoa" aria-label="Edit"><Pencil className="h-4 w-4" /></Link>
                        <button onClick={() => remove(p)} className="rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-600" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="py-10 text-center text-sm text-muted">No products match this filter.</p>}
        </div>
      )}
    </div>
  );
}
