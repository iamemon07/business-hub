import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import { connectDB } from "./db";
import { businessUrl, classifyHost } from "./hosts";
import { setRequestTenantResolver } from "./tenant-context";
import { Plan, Tenant } from "@/models/platform";
import type { TenantInfo } from "@/types";

export const TENANTS_TAG = "tenants";

/** Host → business lookup, cached and invalidated whenever a business changes in the console. */
export const getTenantByHost = unstable_cache(
  async (host: string): Promise<TenantInfo | null> => {
    const kind = classifyHost(host);
    if (kind.kind === "platform") return null;
    await connectDB();
    const filter = kind.kind === "subdomain" ? { slug: kind.slug } : { customDomains: kind.host };
    const t = await Tenant.findOne(filter).lean();
    if (!t) return null;
    const plan = t.plan ? await Plan.findById(t.plan).select("name limits").lean() : null;
    return {
      id: String(t._id),
      name: t.name,
      slug: t.slug,
      status: t.status as TenantInfo["status"],
      template: t.template,
      url: businessUrl(t),
      trialEndsAt: t.trialEndsAt?.toISOString(),
      paidUntil: t.paidUntil?.toISOString(),
      plan: plan
        ? {
            name: plan.name,
            limits: {
              products: plan.limits?.products ?? 0,
              staff: plan.limits?.staff ?? 0,
              customDomain: Boolean(plan.limits?.customDomain),
            },
          }
        : null,
    };
  },
  ["tenant-by-host"],
  { tags: [TENANTS_TAG], revalidate: 300 },
);

export async function requestHost() {
  const h = await headers();
  return h.get("x-forwarded-host") ?? h.get("host") ?? "";
}

/** The business for the current request (null on the platform host or an unknown domain). */
export const currentTenant = cache(async (): Promise<TenantInfo | null> => getTenantByHost(await requestHost()));

/** Same as currentTenant(), but renders the 404 page when the host isn't a known business. */
export async function requireTenant() {
  const t = await currentTenant();
  if (!t) notFound();
  return t;
}

export function isClosed(t: TenantInfo) {
  return t.status === "suspended" || t.status === "cancelled";
}

// Lets tenant-scoped models resolve the business from the request in Server Components.
setRequestTenantResolver(async () => (await currentTenant())?.id ?? null);
