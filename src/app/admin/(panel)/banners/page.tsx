"use client";

import Image from "next/image";
import { ResourceManager } from "@/components/admin/ResourceManager";
import { Badge } from "@/components/admin/ui";
import type { BannerDTO } from "@/types";

export default function BannersPage() {
  return (
    <ResourceManager<BannerDTO>
      title="Banners"
      singular="Banner"
      description="Homepage hero slider and promotional banners. If your image already contains text (like your brand banner), keep “Show text overlay” off."
      endpoint="/api/admin/banners"
      defaults={{ title: "", subtitle: "", image: "", mobileImage: "", link: "/shop", ctaText: "Shop Now", placement: "hero", showOverlayText: false, sortOrder: 0, active: true }}
      fields={[
        { name: "image", label: "Desktop Image (wide, e.g. 2000×750)", type: "image" },
        { name: "mobileImage", label: "Mobile Image (optional, portrait/square)", type: "image" },
        { name: "placement", label: "Placement", type: "select", options: [{ value: "hero", label: "Hero slider (top of homepage)" }, { value: "promo", label: "Promo banner (mid-page, max 2)" }] },
        { name: "link", label: "Link", type: "text", placeholder: "/shop?filter=new" },
        { name: "title", label: "Title", type: "text" },
        { name: "subtitle", label: "Subtitle / Eyebrow", type: "text" },
        { name: "ctaText", label: "Button Text", type: "text" },
        { name: "sortOrder", label: "Display Order", type: "number" },
        { name: "showOverlayText", label: "Show text overlay", type: "toggle", description: "Display title, subtitle & button on top of the image" },
        { name: "active", label: "Active", type: "toggle" },
      ]}
      columns={[
        {
          header: "Banner",
          cell: (b) => (
            <div className="flex items-center gap-3">
              <div className="relative h-14 w-36 overflow-hidden rounded-lg bg-blush-100">
                {b.image && <Image src={b.image} alt="" fill sizes="144px" className="object-cover" unoptimized={!b.image.startsWith("/")} />}
              </div>
              <div>
                <p className="font-medium">{b.title || "Untitled"}</p>
                <p className="text-xs text-muted">{b.link}</p>
              </div>
            </div>
          ),
        },
        { header: "Placement", cell: (b) => <Badge tone={b.placement === "hero" ? "rose" : "blue"}>{b.placement}</Badge> },
        { header: "Order", cell: (b) => b.sortOrder },
        { header: "Status", cell: (b) => (b.active ? <Badge tone="green">Live</Badge> : <Badge>Hidden</Badge>) },
      ]}
      emptyText="Without banners, the homepage shows your default brand banner."
    />
  );
}
