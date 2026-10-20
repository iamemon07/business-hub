"use client";

import Link from "next/link";
import { ResourceManager } from "@/components/admin/ResourceManager";
import { Badge } from "@/components/admin/ui";
import type { PageDTO } from "@/types";

export default function PagesAdminPage() {
  return (
    <ResourceManager<PageDTO>
      title="Pages"
      singular="Page"
      description="About, policies, care guide and other content pages. Use “## ” for headings, “- ” for bullet points and a blank line between paragraphs."
      endpoint="/api/admin/pages"
      searchKeys={["title", "slug"]}
      defaults={{ slug: "", title: "", content: "", showInFooter: true, active: true }}
      fields={[
        { name: "title", label: "Title", type: "text", required: true },
        { name: "slug", label: "URL Slug", type: "text", required: true, placeholder: "return-policy" },
        { name: "content", label: "Content", type: "textarea", rows: 14 },
        { name: "showInFooter", label: "Show link in footer", type: "toggle" },
        { name: "active", label: "Published", type: "toggle" },
      ]}
      columns={[
        { header: "Title", cell: (p) => <span className="font-medium">{p.title}</span> },
        { header: "URL", cell: (p) => <Link href={`/pages/${p.slug}`} target="_blank" className="text-rose hover:underline">/pages/{p.slug}</Link> },
        { header: "Footer", cell: (p) => (p.showInFooter ? "Yes" : "No") },
        { header: "Status", cell: (p) => (p.active ? <Badge tone="green">Published</Badge> : <Badge>Draft</Badge>) },
      ]}
    />
  );
}
