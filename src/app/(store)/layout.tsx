import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { CartDrawer } from "@/components/store/CartDrawer";
import { Footer } from "@/components/store/Footer";
import { Header } from "@/components/store/Header";
import { StoreProvider } from "@/components/store/StoreContext";
import { ThemeStyle } from "@/components/ThemeStyle";
import { brandAsset, getStore } from "@/lib/store";
import { isClosed } from "@/lib/tenant";
import { getCategories, getFooterPages } from "@/services/catalog";

// Content is managed live from the admin panel; cached per-tag and revalidated on every admin change.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { tenant, settings } = await getStore();
  const logo = settings.logo || brandAsset(tenant.id, "logo");
  return {
    metadataBase: new URL(tenant.url),
    title: { default: settings.seo.title || settings.storeName, template: `%s · ${settings.storeName}` },
    description: settings.seo.description || settings.footerAbout,
    icons: { icon: logo, apple: logo },
  };
}

export async function generateViewport(): Promise<Viewport> {
  const { settings } = await getStore();
  return { themeColor: settings.theme.background };
}

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const { tenant, settings } = await getStore();

  if (isClosed(tenant)) {
    return (
      <>
        <ThemeStyle theme={settings.theme} />
        <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-4 text-center">
          <h1 className="heading-display text-5xl">{settings.storeName}</h1>
          <p className="mt-4 max-w-md text-sm text-muted">This store is temporarily unavailable. Please check back soon.</p>
          {settings.phone && <p className="mt-6 text-sm">Contact: {settings.phone}</p>}
        </div>
      </>
    );
  }

  const [categories, pages] = await Promise.all([getCategories(tenant.id), getFooterPages(tenant.id)]);
  const navCategories = categories.map((c) => ({ name: c.name, slug: c.slug }));
  const logo = settings.logo || brandAsset(tenant.id, "logo");

  return (
    <StoreProvider
      value={{
        currency: settings.currencySymbol,
        freeShippingThreshold: settings.shipping.freeShippingThreshold,
        catalog: settings.catalog,
      }}
    >
      <ThemeStyle theme={settings.theme} />
      {settings.announcement.enabled && settings.announcement.text && (
        <div className="bg-cocoa py-2.5 text-center text-[11px] tracking-[0.2em] text-ivory uppercase print:hidden">
          <Link href={settings.announcement.link || "/shop"} className="px-4 hover:text-blush-200">
            {settings.announcement.text}
          </Link>
        </div>
      )}
      <Header
        logo={logo}
        storeName={settings.storeName}
        wordmark={settings.wordmark}
        scriptLine={settings.scriptLines.header || settings.tagline}
        searchPlaceholder={`Search ${settings.catalog.itemNounPlural}…`}
        categories={navCategories}
      />
      <main>{children}</main>
      <Footer settings={{ ...settings, logo }} categories={navCategories} pages={pages} />
      <CartDrawer />
    </StoreProvider>
  );
}
