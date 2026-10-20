import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/store/ProductCard";
import { ProductDetail } from "@/components/store/ProductDetail";
import { SectionHeading } from "@/components/store/SectionHeading";
import { getProductBySlug, getRelatedProducts } from "@/services/catalog";
import { getStore } from "@/lib/store";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const { tenant } = await getStore();
  const product = await getProductBySlug(tenant.id, slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.seoTitle || product.name,
    description: product.seoDescription || product.shortDescription || product.description.slice(0, 160),
    openGraph: { images: product.images.slice(0, 1), type: "website" },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const { tenant, settings } = await getStore();
  const product = await getProductBySlug(tenant.id, slug);
  if (!product) notFound();
  const related = await getRelatedProducts(tenant.id, product._id, product.category?._id);

  const s = settings.shipping;
  const deliveryText = [
    `Estimated delivery: ${s.minDays}–${s.maxDays} working days from the order date.`,
    `Delivery charge: ${settings.currencySymbol}${s.insideFee} (${s.insideCityLabel}) · ${settings.currencySymbol}${s.outsideFee} (${s.outsideCityLabel}).`,
    s.freeShippingThreshold > 0 ? `Free delivery on orders over ${settings.currencySymbol}${s.freeShippingThreshold}.` : "",
    settings.payments.cod.enabled ? "Cash on delivery available." : "",
  ]
    .filter(Boolean)
    .join("\n");

  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images,
    description: product.shortDescription || product.description,
    sku: product.sku || product._id,
    brand: { "@type": "Brand", name: settings.storeName },
    offers: {
      "@type": "Offer",
      priceCurrency: settings.currencySymbol === "৳" ? "BDT" : undefined,
      price: product.salePrice || product.price,
      availability:
        product.variants.length && totalStock === 0 ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    },
  };

  return (
    <div className="container-x py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav className="mb-8 text-xs tracking-wider text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-rose">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/shop" className="hover:text-rose">Shop</Link>
        {product.category && (
          <>
            <span className="mx-2">/</span>
            <Link href={`/shop?category=${product.category.slug}`} className="hover:text-rose">{product.category.name}</Link>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-cocoa">{product.name}</span>
      </nav>

      <ProductDetail product={product} deliveryText={deliveryText} />

      {related.length > 0 && (
        <section className="pt-24">
          <SectionHeading eyebrow="You May Also Like" title="Related Picks" />
          <ProductGrid products={related} currency={settings.currencySymbol} />
        </section>
      )}
    </div>
  );
}
