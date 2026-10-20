import "server-only";
import { cache } from "react";
import { getSettings } from "@/services/settings";
import { requireTenant } from "./tenant";

/** The business behind the current request plus its settings (memoised per request). */
export const getStore = cache(async () => {
  const tenant = await requireTenant();
  const settings = await getSettings(tenant.id);
  return { tenant, settings };
});

/** Default logo/banner for a business without uploaded artwork. */
export function brandAsset(tenantId: string, asset: "logo" | "banner", version?: string) {
  return `/api/brand/${tenantId}/${asset}.svg${version ? `?v=${encodeURIComponent(version)}` : ""}`;
}
