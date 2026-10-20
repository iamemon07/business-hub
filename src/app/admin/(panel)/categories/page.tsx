"use client";

import Image from "next/image";
import { ResourceManager } from "@/components/admin/ResourceManager";
import { Badge } from "@/components/admin/ui";
import type { CategoryDTO } from "@/types";

export default function CategoriesPage() {
  return (
    <ResourceManager<CategoryDTO>
      title="Categories"
      singular="Category"
      description="Group products into collections like Vases & Planters, Wall Decor, Lighting and Cushions & Throws."
      endpoint="/api/admin/categories"
      searchKeys={["name"]}
      defaults={{ name: "", slug: "", description: "", image: "", sortOrder: 0, showOnHome: true, active: true }}
      fields={[
        { name: "name", label: "Name", type: "text", required: true },
        { name: "slug", label: "URL Slug", type: "text", hint: "Auto from name if empty" },
        { name: "description", label: "Description", type: "textarea", rows: 2 },
        { name: "image", label: "Cover Image (portrait)", type: "image" },
        { name: "sortOrder", label: "Display Order", type: "number", hint: "Lower shows first" },
        { name: "showOnHome", label: "Show on homepage", type: "toggle" },
        { name: "active", label: "Active", type: "toggle" },
      ]}
      columns={[
        {
          header: "Category",
          cell: (c) => (
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-10 overflow-hidden rounded-lg bg-blush-100">
                {c.image && <Image src={c.image} alt="" fill sizes="40px" className="object-cover" unoptimized={!c.image.startsWith("/")} />}
              </div>
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-muted">/{c.slug}</p>
              </div>
            </div>
          ),
        },
        { header: "Order", cell: (c) => c.sortOrder },
        { header: "Homepage", cell: (c) => (c.showOnHome ? <Badge tone="green">Shown</Badge> : <Badge>Hidden</Badge>) },
        { header: "Status", cell: (c) => (c.active ? <Badge tone="green">Active</Badge> : <Badge tone="red">Inactive</Badge>) },
      ]}
    />
  );
}
