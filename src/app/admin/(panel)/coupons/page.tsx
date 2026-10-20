"use client";

import { ResourceManager } from "@/components/admin/ResourceManager";
import { Badge } from "@/components/admin/ui";
import { formatDate, formatPrice } from "@/lib/utils";

type Coupon = {
  _id: string;
  code: string;
  description: string;
  type: "percent" | "fixed";
  value: number;
  minOrder: number;
  maxDiscount: number;
  usageLimit: number;
  usedCount: number;
  startsAt?: string;
  expiresAt?: string;
  active: boolean;
};

export default function CouponsPage() {
  return (
    <ResourceManager<Coupon>
      title="Coupons"
      singular="Coupon"
      description="Create discount codes for campaigns, influencers and loyal customers."
      endpoint="/api/admin/coupons"
      searchKeys={["code", "description"]}
      defaults={{ code: "", description: "", type: "percent", value: 10, minOrder: 0, maxDiscount: 0, usageLimit: 0, startsAt: "", expiresAt: "", active: true }}
      fields={[
        { name: "code", label: "Code", type: "text", required: true, placeholder: "EID20" },
        { name: "type", label: "Type", type: "select", options: [{ value: "percent", label: "Percentage (%)" }, { value: "fixed", label: "Fixed amount" }] },
        { name: "value", label: "Value", type: "number", hint: "e.g. 15 for 15% or 200 for ৳200" },
        { name: "minOrder", label: "Minimum Order", type: "number", hint: "0 = no minimum" },
        { name: "maxDiscount", label: "Max Discount Cap", type: "number", hint: "0 = no cap (percent coupons)" },
        { name: "usageLimit", label: "Total Usage Limit", type: "number", hint: "0 = unlimited" },
        { name: "startsAt", label: "Starts On", type: "date" },
        { name: "expiresAt", label: "Expires On", type: "date" },
        { name: "description", label: "Internal Description", type: "text", full: true },
        { name: "active", label: "Active", type: "toggle" },
      ]}
      columns={[
        { header: "Code", cell: (c) => <span className="rounded-lg bg-blush-100 px-2.5 py-1 font-mono text-sm font-semibold">{c.code}</span> },
        { header: "Discount", cell: (c) => (c.type === "percent" ? `${c.value}%${c.maxDiscount ? ` (max ${formatPrice(c.maxDiscount)})` : ""}` : formatPrice(c.value)) },
        { header: "Min Order", cell: (c) => (c.minOrder ? formatPrice(c.minOrder) : "—") },
        { header: "Used", cell: (c) => `${c.usedCount}${c.usageLimit ? ` / ${c.usageLimit}` : ""}` },
        { header: "Valid", cell: (c) => <span className="text-xs text-muted">{c.startsAt ? formatDate(c.startsAt) : "Now"} → {c.expiresAt ? formatDate(c.expiresAt) : "∞"}</span> },
        {
          header: "Status",
          cell: (c) => {
            const expired = c.expiresAt && new Date(c.expiresAt) < new Date();
            return !c.active ? <Badge tone="red">Off</Badge> : expired ? <Badge tone="amber">Expired</Badge> : <Badge tone="green">Active</Badge>;
          },
        },
      ]}
    />
  );
}
