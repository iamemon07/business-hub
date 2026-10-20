import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import { palette } from "@/lib/theme";
import { runWithTenant } from "@/lib/tenant-context";
import { wordmarkOf } from "@/lib/utils";
import { Settings } from "@/models/Settings";
import { Tenant } from "@/models/platform";

/**
 * Placeholder artwork for a business that hasn't uploaded its own:
 *   /api/brand/<tenantId>/logo.svg    → round monogram in the brand colors
 *   /api/brand/<tenantId>/banner.svg  → 16:9 hero banner with name + tagline
 * Addressed by id (not host) so Next's image optimizer can fetch it from any host.
 */
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function logoSvg(name: string, p: ReturnType<typeof palette>) {
  const letter = esc((name.trim()[0] ?? "S").toUpperCase());
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <circle cx="256" cy="256" r="256" fill="${p.cocoa}"/>
  <circle cx="256" cy="256" r="232" fill="none" stroke="${p.rose}" stroke-width="4"/>
  <path d="M166 395 V235 a90 90 0 0 1 180 0 V395" fill="none" stroke="${p.cream}" stroke-width="11" stroke-linecap="round"/>
  <line x1="146" y1="395" x2="366" y2="395" stroke="${p.cream}" stroke-width="11" stroke-linecap="round"/>
  <text x="256" y="350" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="165" fill="${p.cream}">${letter}</text>
  <path d="M256 114 q19 -20 0 -46 q-19 26 0 46z" fill="${p.rose}"/>
</svg>`;
}

function bannerSvg(name: string, sub: string, tagline: string, p: ReturnType<typeof palette>) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <rect width="1920" height="1080" fill="${p.cream}"/>
  <path d="M1120 1080 V560 a300 300 0 0 1 600 0 V1080z" fill="${p["blush-200"]}"/>
  <path d="M1220 1080 V600 a200 200 0 0 1 400 0 V1080z" fill="${p["blush-100"]}"/>
  <circle cx="1420" cy="760" r="120" fill="${p.rose}"/>
  <rect x="1300" y="880" width="240" height="200" rx="24" fill="${p.cocoa}"/>
  <text x="200" y="470" font-family="Georgia, 'Times New Roman', serif" font-size="${name.length > 9 ? 110 : 150}" letter-spacing="24" fill="${p.cocoa}">${esc(name)}</text>
  ${sub ? `<text x="208" y="545" font-family="Georgia, serif" font-size="34" letter-spacing="20" fill="${p.rose}">${esc(sub)}</text>` : ""}
  ${tagline ? `<text x="204" y="660" font-family="Georgia, serif" font-style="italic" font-size="50" fill="${p["cocoa-light"]}">${esc(tagline)}</text>` : ""}
</svg>`;
}

export async function GET(_req: Request, { params }: { params: Promise<{ tenantId: string; asset: string }> }) {
  const { tenantId, asset } = await params;
  if (!isValidObjectId(tenantId) || !["logo.svg", "banner.svg"].includes(asset)) {
    return new Response("Not found", { status: 404 });
  }
  await connectDB();
  const tenant = await Tenant.findById(tenantId).select("name").lean();
  if (!tenant) return new Response("Not found", { status: 404 });
  const settings = await runWithTenant(tenantId, () =>
    Settings.findOne({ key: "site" }).select("storeName tagline wordmark theme").lean(),
  );
  const name = settings?.storeName || tenant.name;
  const p = palette(settings?.theme as Parameters<typeof palette>[0]);
  const mark = wordmarkOf(name, settings?.wordmark as { main?: string; sub?: string } | undefined);
  const svg =
    asset === "logo.svg" ? logoSvg(mark.main || name, p) : bannerSvg(mark.main, mark.sub, settings?.tagline ?? "", p);

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    },
  });
}
