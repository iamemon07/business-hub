/**
 * Edge-safe hostname helpers (used by middleware and server code — no DB access here).
 *
 *   PLATFORM_DOMAIN=localhost:3000        →  localhost:3000            = platform (landing + console)
 *                                           sunrise.localhost:3000    = business "sunrise"
 *                                           shop.example.com          = custom domain (looked up in DB)
 */

/** Subdomains that can never be used for a business. */
export const RESERVED_SLUGS = new Set([
  "www", "app", "admin", "api", "console", "hub", "mail", "smtp", "static", "assets", "cdn",
  "help", "support", "blog", "docs", "status", "billing", "login", "signup", "dashboard",
]);

export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;

export function platformDomain() {
  return (process.env.PLATFORM_DOMAIN || "localhost:3000").toLowerCase().trim();
}

export function platformProtocol() {
  const d = platformDomain();
  return d.startsWith("localhost") || d.includes(".localhost") || d.startsWith("127.") ? "http" : "https";
}

export function platformUrl(path = "") {
  return `${platformProtocol()}://${platformDomain()}${path}`;
}

export function normalizeHost(raw: string | null | undefined) {
  return (raw ?? "").split(",")[0].trim().toLowerCase().replace(/\.$/, "");
}

export type HostKind = { kind: "platform" } | { kind: "subdomain"; slug: string } | { kind: "custom"; host: string };

export function classifyHost(rawHost: string | null | undefined): HostKind {
  const host = normalizeHost(rawHost);
  const root = platformDomain();
  if (!host || host === root || host === `www.${root}`) return { kind: "platform" };
  if (host.endsWith(`.${root}`)) {
    const slug = host.slice(0, -(root.length + 1));
    // Only single-level subdomains are businesses (a.b.root is treated as unknown/custom).
    if (slug && !slug.includes(".") && !RESERVED_SLUGS.has(slug)) return { kind: "subdomain", slug };
    if (slug === "www") return { kind: "platform" };
  }
  return { kind: "custom", host: host.replace(/^www\./, "") };
}

/** Public URL of a business: first custom domain if any, else its subdomain. */
export function businessUrl(t: { slug: string; customDomains?: string[] | null }, path = "") {
  const custom = t.customDomains?.[0];
  if (custom) return `https://${custom}${path}`;
  return `${platformProtocol()}://${t.slug}.${platformDomain()}${path}`;
}
