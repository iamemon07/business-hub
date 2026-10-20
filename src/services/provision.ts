import "server-only";
import bcrypt from "bcryptjs";
import { revalidateTag } from "next/cache";
import { ApiError } from "@/lib/api";
import { RESERVED_SLUGS, SLUG_PATTERN } from "@/lib/hosts";
import { brandAsset } from "@/lib/store";
import { runWithTenant } from "@/lib/tenant-context";
import { TENANTS_TAG } from "@/lib/tenant";
import { Admin } from "@/models/Admin";
import { Banner } from "@/models/Banner";
import { Category } from "@/models/Category";
import { Counter } from "@/models/Counter";
import { Coupon } from "@/models/Coupon";
import { Expense, Investment } from "@/models/Finance";
import { Order } from "@/models/Order";
import { Page } from "@/models/Page";
import { Product } from "@/models/Product";
import { Settings } from "@/models/Settings";
import { PlatformSettings, Tenant, TenantPayment, type TenantStatus } from "@/models/platform";
import { commonPages, getTemplate } from "@/templates";
import { revalidateTenant } from "./settings";
import type { ThemeDTO } from "@/types";

/** Every tenant-scoped collection — used when deleting a business. */
const TENANT_MODELS = [Admin, Banner, Category, Counter, Coupon, Expense, Investment, Order, Page, Product, Settings] as const;

export type CreateBusinessInput = {
  name: string;
  slug: string;
  template: string;
  owner: { name: string; email: string; phone?: string; password: string };
  planId?: string;
  status?: TenantStatus;
  trialDays?: number;
  currencySymbol?: string;
  theme?: Partial<ThemeDTO>;
  customDomains?: string[];
};

export async function assertSlugAvailable(slug: string, excludeId?: string) {
  if (!SLUG_PATTERN.test(slug)) throw new ApiError(422, "Store address can use lowercase letters, numbers and dashes (2–40 chars)");
  if (RESERVED_SLUGS.has(slug)) throw new ApiError(409, `"${slug}" is reserved — please choose another address`);
  if (await Tenant.exists({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) }))
    throw new ApiError(409, `The address "${slug}" is already taken`);
}

export function orderPrefixFor(name: string) {
  const letters = name.replace(/[^a-zA-Z ]/g, "").trim();
  const words = letters.split(/\s+/).filter(Boolean);
  const prefix = words.length > 1 ? words.slice(0, 3).map((w) => w[0]).join("") : letters.slice(0, 2);
  return (prefix || "OR").toUpperCase();
}

/** Creates a business with everything it needs to go live: settings, owner login, categories, pages, banner. */
export async function createBusiness(input: CreateBusinessInput) {
  const slug = input.slug.trim().toLowerCase();
  await assertSlugAvailable(slug);
  const tpl = getTemplate(input.template);
  const platform = await PlatformSettings.findOne({ key: "platform" }).lean();
  const trialDays = input.trialDays ?? platform?.trialDays ?? 14;
  const status = input.status ?? "trial";

  const tenant = await Tenant.create({
    name: input.name.trim(),
    slug,
    template: tpl.key,
    status,
    plan: input.planId || undefined,
    trialEndsAt: status === "trial" ? new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000) : undefined,
    owner: { name: input.owner.name, email: input.owner.email.toLowerCase(), phone: input.owner.phone ?? "" },
    customDomains: input.customDomains ?? [],
  });
  const tid = String(tenant._id);

  try {
    await runWithTenant(tid, async () => {
      const name = input.name.trim();
      await Settings.create({
        key: "site",
        storeName: name,
        tagline: tpl.tagline,
        currencySymbol: input.currencySymbol || platform?.currencySymbol || "৳",
        scriptLines: tpl.scriptLines,
        theme: { ...tpl.theme, ...input.theme },
        catalog: tpl.catalog,
        email: input.owner.email.toLowerCase(),
        phone: input.owner.phone ?? "",
        announcement: { enabled: Boolean(tpl.announcement), text: tpl.announcement, link: "/shop" },
        home: { ...tpl.home },
        orders: { prefix: orderPrefixFor(name), notifyEmail: input.owner.email.toLowerCase(), timezone: "Asia/Dhaka" },
        invoice: { footerNote: tpl.invoiceNote },
        seo: { title: `${name} — ${tpl.tagline}`, description: tpl.footerAbout },
        footerAbout: tpl.footerAbout,
      });
      await Admin.create({
        name: input.owner.name,
        email: input.owner.email.toLowerCase(),
        passwordHash: await bcrypt.hash(input.owner.password, 12),
        role: "owner",
      });
      await Category.insertMany(tpl.categories.map((c, i) => ({ ...c, sortOrder: i + 1 })));
      const pages = [...commonPages(name), ...tpl.pages];
      await Page.insertMany(pages);
      await Banner.create({
        title: name,
        image: brandAsset(tid, "banner"),
        link: "/shop",
        placement: "hero",
        showOverlayText: false,
        sortOrder: 0,
      });
    });
  } catch (err) {
    await deleteBusiness(tid).catch((e) => console.error("[provision] cleanup failed", e));
    throw err;
  }

  revalidateTag(TENANTS_TAG);
  return tenant.toObject();
}

/** Permanently deletes a business and all of its data. */
export async function deleteBusiness(tenantId: string) {
  await runWithTenant(tenantId, async () => {
    for (const model of TENANT_MODELS) await (model as typeof Admin).deleteMany({});
  });
  await TenantPayment.deleteMany({ tenant: tenantId });
  await Tenant.deleteOne({ _id: tenantId });
  revalidateTenant(tenantId);
  revalidateTag(TENANTS_TAG);
}
