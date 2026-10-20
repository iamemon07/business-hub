import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProductGrid } from "@/components/store/ProductCard";
import { ShopFilters } from "@/components/store/ShopFilters";
import { getCategories, getProducts } from "@/services/catalog";
import { getStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type SP = Promise<Record<string, string | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const sp = await searchParams;
  const { tenant, settings } = await getStore();
  const categories = await getCategories(tenant.id);
  const cat = categories.find((c) => c.slug === sp.category);
  return {
    title: cat?.name ?? (sp.filter === "new" ? "New Arrivals" : sp.filter === "sale" ? "Sale" : sp.filter === "best" ? "Best Sellers" : "Shop"),
    description: cat?.description || `Browse the full ${settings.storeName} collection.`,
  };
}

export default async function ShopPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const { tenant, settings } = await getStore();
  const [categories, result] = await Promise.all([
    getCategories(tenant.id),
    getProducts(tenant.id, {
      category: sp.category,
      q: sp.q,
      sort: sp.sort,
      spec: sp.spec,
      specKey: settings.catalog.filterSpec || undefined,
      filter: sp.filter,
      min: sp.min ? Number(sp.min) : undefined,
      max: sp.max ? Number(sp.max) : undefined,
      page,
      limit: 12,
    }),
  ]);

  const category = categories.find((c) => c.slug === sp.category);
  const title = sp.q
    ? `Results for “${sp.q}”`
    : category?.name ??
      ({ new: "New Arrivals", best: "Best Sellers", sale: "On Sale" } as Record<string, string>)[sp.filter ?? ""] ??
      "The Collection";

  const pageHref = (p: number) => {
    const next = new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]);
    next.set("page", String(p));
    return `/shop?${next.toString()}`;
  };

  return (
    <div className="container-x py-12">
      <div className="mb-12 text-center">
        <p className="eyebrow mb-3">{settings.storeName}</p>
        <h1 className="heading-display text-5xl">{title}</h1>
        {category?.description && <p className="mx-auto mt-4 max-w-xl text-sm text-muted">{category.description}</p>}
      </div>

      <Suspense>
        <ShopFilters
          categories={categories.map((c) => ({ name: c.name, slug: c.slug }))}
          total={result.total}
          filter={settings.catalog.filterSpec ? { label: settings.catalog.filterSpec, values: settings.catalog.filterValues } : null}
          nouns={{ one: settings.catalog.itemNoun, many: settings.catalog.itemNounPlural }}
        >
          {result.items.length ? (
            <ProductGrid products={result.items} currency={settings.currencySymbol} />
          ) : (
            <div className="card flex flex-col items-center py-20 text-center">
              <p className="font-display text-3xl">Nothing here yet</p>
              <p className="mt-2 text-sm text-muted">Try removing a filter or browse everything.</p>
              <Link href="/shop" className="btn-outline mt-6">
                View All
              </Link>
            </div>
          )}

          {result.pages > 1 && (
            <nav className="mt-14 flex justify-center gap-2" aria-label="Pagination">
              {Array.from({ length: result.pages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={pageHref(p)}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border text-sm transition",
                    p === page ? "border-cocoa bg-cocoa text-ivory" : "border-line hover:border-rose",
                  )}
                >
                  {p}
                </Link>
              ))}
            </nav>
          )}
        </ShopFilters>
      </Suspense>
    </div>
  );
}
