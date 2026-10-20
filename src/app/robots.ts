import type { MetadataRoute } from "next";
import { platformUrl } from "@/lib/hosts";
import { currentTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const tenant = await currentTenant();
  const base = tenant?.url ?? platformUrl();
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/console", "/api", "/checkout", "/order/"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
