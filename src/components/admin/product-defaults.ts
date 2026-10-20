/** Product form shape and defaults. Kept outside the "use client" form so server pages can use them. */
import { DEFAULT_OPTION } from "@/lib/utils";

export type ProductFormValues = {
  name: string;
  slug: string;
  sku: string;
  shortDescription: string;
  description: string;
  category: string;
  images: string[];
  price: number | "";
  discountPercent: number | "";
  costPrice: number | "";
  variants: { size: string; stock: number | "" }[];
  colors: string[];
  specs: { key: string; value: string }[];
  care: string;
  tags: string[];
  isNewArrival: boolean;
  isBestSeller: boolean;
  isFeatured: boolean;
  active: boolean;
  seoTitle: string;
  seoDescription: string;
};

export const EMPTY_PRODUCT: ProductFormValues = {
  name: "",
  slug: "",
  sku: "",
  shortDescription: "",
  description: "",
  category: "",
  images: [],
  price: "",
  discountPercent: 0,
  costPrice: "",
  variants: [{ size: DEFAULT_OPTION, stock: 0 }],
  colors: [],
  specs: [],
  care: "",
  tags: [],
  isNewArrival: true,
  isBestSeller: false,
  isFeatured: false,
  active: true,
  seoTitle: "",
  seoDescription: "",
};
