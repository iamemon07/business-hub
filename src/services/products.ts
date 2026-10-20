import "server-only";
import { slugify } from "@/lib/utils";
import { Product } from "@/models/Product";

/** Ensures a unique slug by suffixing -2, -3, … when needed. */
export async function uniqueSlug(base: string, excludeId?: string) {
  const root = slugify(base) || "product";
  let slug = root;
  for (let i = 2; await Product.exists({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) }); i++) {
    slug = `${root}-${i}`;
  }
  return slug;
}
