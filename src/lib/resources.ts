import "server-only";
import { ApiError } from "./api";
import { slugify } from "./utils";
import { bannerSchema, categorySchema, couponSchema, expenseSchema, investmentSchema, pageSchema } from "./validators";
import { Banner } from "@/models/Banner";
import { Category } from "@/models/Category";
import { Coupon } from "@/models/Coupon";
import { Expense, Investment } from "@/models/Finance";
import { Page } from "@/models/Page";
import { Product } from "@/models/Product";
import { TAGS } from "@/services/settings";

/** CRUD configuration for the simple admin resources. */
export const resources = {
  categories: {
    model: Category,
    schema: categorySchema,
    tags: [TAGS.categories],
    sort: { sortOrder: 1, name: 1 } as Record<string, 1 | -1>,
    transform: (d: Record<string, unknown>) => ({ ...d, slug: slugify(String(d.slug || d.name)) }),
    beforeDelete: async (id: string) => {
      const count = await Product.countDocuments({ category: id });
      if (count > 0) throw new ApiError(409, `This category has ${count} product(s). Move them first.`);
    },
  },
  coupons: {
    model: Coupon,
    schema: couponSchema,
    transform: (d: Record<string, unknown>) => ({ ...d, code: String(d.code).toUpperCase() }),
  },
  banners: {
    model: Banner,
    schema: bannerSchema,
    tags: [TAGS.banners],
    sort: { placement: 1, sortOrder: 1 } as Record<string, 1 | -1>,
  },
  pages: { model: Page, schema: pageSchema, tags: [TAGS.pages], sort: { title: 1 } as Record<string, 1 | -1> },
  expenses: { model: Expense, schema: expenseSchema, sort: { date: -1 } as Record<string, 1 | -1> },
  investments: { model: Investment, schema: investmentSchema, sort: { date: -1 } as Record<string, 1 | -1>, ownerOnly: true },
};
