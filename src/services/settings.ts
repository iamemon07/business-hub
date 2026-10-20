import "server-only";
import { revalidateTag, unstable_cache } from "next/cache";
import { connectDB } from "@/lib/db";
import { serialize } from "@/lib/serialize";
import { runWithTenant } from "@/lib/tenant-context";
import { Settings } from "@/models/Settings";
import type { SettingsDTO } from "@/types";

export const TAGS = {
  settings: "settings",
  products: "products",
  categories: "categories",
  banners: "banners",
  pages: "pages",
} as const;

export type TagName = keyof typeof TAGS;

/** Cache tags are per business so one store's edits never flush another store's cache. */
export function tenantTag(tenantId: string, name: TagName) {
  return `t:${tenantId}:${name}`;
}

export function revalidateTenant(tenantId: string, ...names: TagName[]) {
  for (const n of names.length ? names : (Object.keys(TAGS) as TagName[])) revalidateTag(tenantTag(tenantId, n));
}

/** Reads the business's settings document, creating it with defaults on first run. Uncached. */
export async function loadSettings(): Promise<SettingsDTO> {
  await connectDB();
  let doc = await Settings.findOne({ key: "site" }).lean();
  if (!doc) {
    await Settings.updateOne({ key: "site" }, { $setOnInsert: { key: "site" } }, { upsert: true });
    doc = await Settings.findOne({ key: "site" }).lean();
  }
  return serialize<SettingsDTO>(doc);
}

/**
 * Runs `fn` for a business through Next's data cache. Key and tags include the business id,
 * and the function runs inside that business's query scope.
 */
export function tenantCached<T>(
  tenantId: string,
  key: (string | number | undefined)[],
  tags: TagName[],
  fn: () => Promise<T>,
  revalidate = 300,
): Promise<T> {
  return unstable_cache(() => runWithTenant(tenantId, fn), [tenantId, ...key.map((k) => String(k ?? ""))], {
    tags: tags.map((t) => tenantTag(tenantId, t)),
    revalidate,
  })();
}

/** Cached settings for a business. */
export function getSettings(tenantId: string) {
  return tenantCached(tenantId, ["site-settings"], ["settings"], loadSettings, 3600);
}
