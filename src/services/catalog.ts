import "server-only";
import type { FilterQuery, SortOrder } from "mongoose";
import { connectDB } from "@/lib/db";
import { serialize } from "@/lib/serialize";
import { escapeRegex } from "@/lib/utils";
import { Product, type ProductDoc } from "@/models/Product";
import { Category } from "@/models/Category";
import { Banner } from "@/models/Banner";
import { Page } from "@/models/Page";
import type { BannerDTO, CategoryDTO, PageDTO, ProductDTO } from "@/types";
import { tenantCached } from "./settings";

/** Fields never sent to the storefront. */
const PUBLIC_PROJECTION = "-costPrice -__v";

export function getCategories(tenantId: string) {
  return tenantCached(tenantId, ["categories"], ["categories"], async (): Promise<CategoryDTO[]> => {
    await connectDB();
    const docs = await Category.find({ active: true }).sort({ sortOrder: 1, name: 1 }).lean();
    return serialize(docs);
  }, 3600);
}

export type ProductQuery = {
  category?: string;
  q?: string;
  sort?: string;
  min?: number;
  max?: number;
  /** Value of the business's filter spec (e.g. "Ceramic" when filterSpec = "Material"). */
  spec?: string;
  specKey?: string;
  filter?: string; // new | best | sale | featured
  page?: number;
  limit?: number;
};

const SORTS: Record<string, Record<string, SortOrder>> = {
  newest: { createdAt: -1 },
  "price-asc": { salePrice: 1 },
  "price-desc": { salePrice: -1 },
  popular: { soldCount: -1, createdAt: -1 },
  discount: { discountPercent: -1, createdAt: -1 },
};

async function queryProducts(params: ProductQuery) {
  await connectDB();
  const filter: FilterQuery<ProductDoc> = { active: true };

  if (params.category) {
    const cat = await Category.findOne({ slug: params.category, active: true }).select("_id").lean();
    if (!cat) return { items: [] as ProductDTO[], total: 0, page: 1, pages: 0 };
    filter.category = cat._id;
  }
  if (params.q) {
    const rx = new RegExp(escapeRegex(params.q.slice(0, 60)), "i");
    filter.$or = [{ name: rx }, { tags: rx }, { shortDescription: rx }, { "specs.value": rx }];
  }
  if (params.min != null || params.max != null) {
    filter.salePrice = {};
    if (params.min != null && !Number.isNaN(params.min)) filter.salePrice.$gte = params.min;
    if (params.max != null && !Number.isNaN(params.max)) filter.salePrice.$lte = params.max;
  }
  if (params.spec && params.specKey)
    filter.specs = { $elemMatch: { key: params.specKey, value: new RegExp(escapeRegex(params.spec.slice(0, 40)), "i") } };
  if (params.filter === "new") filter.isNewArrival = true;
  if (params.filter === "best") filter.isBestSeller = true;
  if (params.filter === "featured") filter.isFeatured = true;
  if (params.filter === "sale") filter.discountPercent = { $gt: 0 };

  const limit = Math.min(Math.max(params.limit ?? 12, 1), 48);
  const page = Math.max(params.page ?? 1, 1);
  const sort = SORTS[params.sort ?? "newest"] ?? SORTS.newest;

  const [docs, total] = await Promise.all([
    Product.find(filter)
      .select(PUBLIC_PROJECTION)
      .populate("category", "name slug")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);
  return { items: serialize<ProductDTO[]>(docs), total, page, pages: Math.ceil(total / limit) };
}

export function getProducts(tenantId: string, params: ProductQuery) {
  return tenantCached(tenantId, ["products-query", JSON.stringify(params)], ["products", "categories"], () => queryProducts(params), 120);
}

export function getProductBySlug(tenantId: string, slug: string) {
  return tenantCached(tenantId, ["product-by-slug", slug], ["products"], async (): Promise<ProductDTO | null> => {
    await connectDB();
    const doc = await Product.findOne({ slug, active: true })
      .select(PUBLIC_PROJECTION)
      .populate("category", "name slug")
      .lean();
    return doc ? serialize(doc) : null;
  }, 120);
}

export function getRelatedProducts(tenantId: string, productId: string, categoryId?: string) {
  return tenantCached(tenantId, ["related-products", productId, categoryId], ["products"], async (): Promise<ProductDTO[]> => {
    await connectDB();
    const filter: FilterQuery<ProductDoc> = { active: true, _id: { $ne: productId } };
    if (categoryId) filter.category = categoryId;
    const docs = await Product.find(filter).select(PUBLIC_PROJECTION).sort({ soldCount: -1 }).limit(4).lean();
    return serialize(docs);
  }, 120);
}

export function getHomeData(tenantId: string) {
  return tenantCached(tenantId, ["home-data"], ["products", "banners", "categories"], async () => {
    await connectDB();
    const [hero, promo, newArrivals, bestSellers, onSale, categories] = await Promise.all([
      Banner.find({ active: true, placement: "hero" }).sort({ sortOrder: 1 }).lean(),
      Banner.find({ active: true, placement: "promo" }).sort({ sortOrder: 1 }).limit(2).lean(),
      Product.find({ active: true, isNewArrival: true }).select(PUBLIC_PROJECTION).sort({ createdAt: -1 }).limit(8).lean(),
      Product.find({ active: true, isBestSeller: true }).select(PUBLIC_PROJECTION).sort({ soldCount: -1 }).limit(8).lean(),
      Product.find({ active: true, discountPercent: { $gt: 0 } }).select(PUBLIC_PROJECTION).sort({ discountPercent: -1 }).limit(4).lean(),
      Category.find({ active: true, showOnHome: true }).sort({ sortOrder: 1 }).limit(8).lean(),
    ]);
    return serialize<{
      hero: BannerDTO[];
      promo: BannerDTO[];
      newArrivals: ProductDTO[];
      bestSellers: ProductDTO[];
      onSale: ProductDTO[];
      categories: CategoryDTO[];
    }>({ hero, promo, newArrivals, bestSellers, onSale, categories });
  }, 120);
}

export function getPage(tenantId: string, slug: string) {
  return tenantCached(tenantId, ["page-by-slug", slug], ["pages"], async (): Promise<PageDTO | null> => {
    await connectDB();
    const doc = await Page.findOne({ slug, active: true }).lean();
    return doc ? serialize(doc) : null;
  }, 3600);
}

export function getFooterPages(tenantId: string) {
  return tenantCached(tenantId, ["footer-pages"], ["pages"], async (): Promise<Pick<PageDTO, "slug" | "title">[]> => {
    await connectDB();
    const docs = await Page.find({ active: true, showInFooter: true }).select("slug title").sort({ title: 1 }).lean();
    return serialize(docs);
  }, 3600);
}
