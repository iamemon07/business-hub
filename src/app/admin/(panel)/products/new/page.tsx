import { ProductForm } from "@/components/admin/ProductForm";
import { EMPTY_PRODUCT } from "@/components/admin/product-defaults";
import { connectDB } from "@/lib/db";
import { serialize } from "@/lib/serialize";
import { getStore } from "@/lib/store";
import { Category } from "@/models/Category";

export default async function NewProductPage() {
  await connectDB();
  const { settings } = await getStore();
  const categories = serialize<{ _id: string; name: string }[]>(await Category.find().select("name").sort({ sortOrder: 1 }).lean());
  const { catalog } = settings;
  // Start with the business's first option preset and an empty row for each spec field.
  const initial = {
    ...EMPTY_PRODUCT,
    variants: (catalog.variantPresets[0]?.options ?? ["Standard"]).map((size) => ({ size, stock: 0 as number | "" })),
    specs: catalog.specFields.map((key) => ({ key, value: "" })),
    care: catalog.defaultCare,
  };
  return <ProductForm initial={initial} categories={categories} catalog={catalog} />;
}
