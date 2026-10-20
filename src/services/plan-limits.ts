import "server-only";
import { ApiError } from "@/lib/api";
import { Admin } from "@/models/Admin";
import { Product } from "@/models/Product";
import type { TenantInfo } from "@/types";

/** Blocks creating more products / staff than the business's plan allows (0 = unlimited). */
export async function assertWithinLimit(tenant: TenantInfo, what: "products" | "staff") {
  const limit = tenant.plan?.limits[what] ?? 0;
  if (!limit) return;
  const used = what === "products" ? await Product.countDocuments() : await Admin.countDocuments({ active: true });
  if (used >= limit) {
    const label = what === "products" ? "products" : "team members";
    throw new ApiError(
      403,
      `Your ${tenant.plan?.name ?? "current"} plan allows up to ${limit} ${label}. Please upgrade your plan to add more.`,
    );
  }
}
