import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Gem, RefreshCcw, Truck, Wallet } from "lucide-react";
import { HeroSlider } from "@/components/store/HeroSlider";
import { ProductGrid } from "@/components/store/ProductCard";
import { SectionHeading } from "@/components/store/SectionHeading";
import { getHomeData } from "@/services/catalog";
import { brandAsset, getStore } from "@/lib/store";
import type { BannerDTO } from "@/types";

const FEATURE_ICONS = [Gem, Truck, Wallet, RefreshCcw];

export async function generateMetadata(): Promise<Metadata> {
  const { tenant, settings: s } = await getStore();
  const title = s.seo.title || [s.storeName, s.tagline].filter(Boolean).join(" — ");
  return {
    title: { absolute: title },
    description: s.seo.description || s.footerAbout,
    openGraph: { title, description: s.seo.description, images: [s.home.storyImage || brandAsset(tenant.id, "banner")], type: "website" },
  };
}

const fallbackHero = (tenantId: string, name: string): BannerDTO => ({
  _id: "default-hero",
  title: name,
  subtitle: "",
  image: brandAsset(tenantId, "banner"),
  mobileImage: "",
  link: "/shop",
  ctaText: "",
  placement: "hero",
  showOverlayText: false,
  sortOrder: 0,
  active: true,
});

export default async function HomePage() {
  const { tenant, settings } = await getStore();
  const data = await getHomeData(tenant.id);
  const cur = settings.currencySymbol;
  const hero = data.hero.length ? data.hero : [fallbackHero(tenant.id, settings.storeName)];

  return (
    <>
      <HeroSlider banners={hero} />

      {/* Feature strip */}
      <section className="border-b border-line bg-ivory">
        <div className="container-x grid grid-cols-2 gap-6 py-8 lg:grid-cols-4">
          {settings.home.features.map((f, i) => {
            const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
            return (
              <div key={f.title} className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blush-100 text-rose">
                  <Icon className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-display text-lg leading-tight">{f.title}</p>
                  <p className="text-xs text-muted">{f.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Categories */}
      {data.categories.length > 0 && (
        <section className="container-x pt-20">
          <SectionHeading eyebrow="Collections" title={settings.home.categoriesTitle} />
          <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
            {data.categories.map((c) => (
              <Link
                key={c._id}
                href={`/shop?category=${c.slug}`}
                className="group relative aspect-[4/5] w-[65%] shrink-0 snap-start overflow-hidden rounded-3xl bg-blush-100 sm:w-auto"
              >
                {c.image && (
                  <Image src={c.image} alt={c.name} fill sizes="(max-width: 640px) 65vw, 25vw" className="object-cover transition duration-700 group-hover:scale-105" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-cocoa/70 via-cocoa/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-ivory">
                  <h3 className="font-display text-3xl">{c.name}</h3>
                  <span className="mt-2 inline-block text-[11px] uppercase tracking-[0.25em] text-blush-200 transition group-hover:tracking-[0.35em]">
                    Explore →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* New arrivals */}
      {data.newArrivals.length > 0 && (
        <section className="container-x pt-24">
          <SectionHeading
            eyebrow="Just In"
            title={settings.home.newArrivalsTitle}
            subtitle={settings.home.newArrivalsSubtitle}
            href="/shop?filter=new"
          />
          <ProductGrid products={data.newArrivals} currency={cur} />
        </section>
      )}

      {/* Promo banners */}
      {data.promo.length > 0 && (
        <section className="container-x grid gap-6 pt-24 md:grid-cols-2">
          {data.promo.map((b) => (
            <Link key={b._id} href={b.link || "/shop"} className="group relative aspect-[16/10] overflow-hidden rounded-3xl bg-blush-100">
              <Image src={b.image} alt={b.title || "Promotion"} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover transition duration-700 group-hover:scale-105" />
              {b.showOverlayText && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-cocoa/60 to-transparent" />
                  <div className="absolute inset-y-0 left-0 flex max-w-xs flex-col justify-center p-8 text-ivory">
                    {b.subtitle && <p className="text-[11px] uppercase tracking-[0.3em] text-blush-200">{b.subtitle}</p>}
                    {b.title && <h3 className="mt-2 font-display text-4xl leading-tight">{b.title}</h3>}
                    {b.ctaText && <span className="mt-5 text-xs uppercase tracking-[0.25em] underline underline-offset-8">{b.ctaText}</span>}
                  </div>
                </>
              )}
            </Link>
          ))}
        </section>
      )}

      {/* Best sellers */}
      {data.bestSellers.length > 0 && (
        <section className="container-x pt-24">
          <SectionHeading
            eyebrow="Most Loved"
            title={settings.home.bestSellersTitle}
            subtitle={settings.home.bestSellersSubtitle}
            href="/shop?filter=best"
          />
          <ProductGrid products={data.bestSellers} currency={cur} />
        </section>
      )}

      {/* Brand story */}
      <section className="container-x pt-24">
        <div className="grid items-center overflow-hidden rounded-[2rem] bg-blush-100 md:grid-cols-2">
          <div className="relative aspect-[4/3] md:aspect-auto md:h-full md:min-h-[420px]">
            <Image src={settings.home.storyImage || brandAsset(tenant.id, "banner")} alt="Our story" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover object-right" />
          </div>
          <div className="p-10 lg:p-16">
            <p className="eyebrow mb-4">Our Story</p>
            <h2 className="heading-display text-4xl leading-tight lg:text-5xl">{settings.home.storyTitle}</h2>
            <p className="mt-6 leading-relaxed text-cocoa-light">{settings.home.storyText}</p>
            <p className="mt-6 font-script text-3xl text-rose">{settings.tagline}</p>
            <Link href="/shop" className="btn-primary mt-8">
              Explore Collection
            </Link>
          </div>
        </div>
      </section>

      {/* On sale */}
      {data.onSale.length > 0 && (
        <section className="container-x pt-24">
          <SectionHeading eyebrow="Limited Time" title="On Sale" href="/shop?filter=sale" linkText="Shop the Sale" />
          <ProductGrid products={data.onSale} currency={cur} />
        </section>
      )}

      {data.newArrivals.length === 0 && data.bestSellers.length === 0 && (
        <section className="container-x pt-24 text-center">
          <p className="font-display text-3xl">Our collection is arriving soon</p>
          <p className="mt-2 text-sm text-muted">New {settings.catalog.itemNounPlural} are on the way — check back soon.</p>
        </section>
      )}
    </>
  );
}
