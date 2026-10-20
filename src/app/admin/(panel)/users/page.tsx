"use client";

import { ResourceManager } from "@/components/admin/ResourceManager";
import { Badge } from "@/components/admin/ui";
import { formatDate } from "@/lib/utils";

type AdminUser = { _id: string; name: string; email: string; role: "owner" | "staff"; active: boolean; lastLoginAt?: string };

export default function UsersPage() {
  return (
    <ResourceManager<AdminUser>
      title="Admin Users"
      singular="User"
      description="Owners see everything including finance. Staff can manage orders, products and content."
      endpoint="/api/admin/users"
      defaults={{ name: "", email: "", password: "", role: "staff", active: true }}
      toForm={(u) => ({ ...u, password: "" })}
      fields={[
        { name: "name", label: "Name", type: "text", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        { name: "password", label: "Password", type: "password", hint: "Min 8 characters. Leave blank when editing to keep the current one." },
        { name: "role", label: "Role", type: "select", options: [{ value: "staff", label: "Staff" }, { value: "owner", label: "Owner" }] },
        { name: "active", label: "Active", type: "toggle" },
      ]}
      columns={[
        { header: "Name", cell: (u) => <div><p className="font-medium">{u.name}</p><p className="text-xs text-muted">{u.email}</p></div> },
        { header: "Role", cell: (u) => <Badge tone={u.role === "owner" ? "rose" : "neutral"}>{u.role}</Badge> },
        { header: "Last Login", cell: (u) => (u.lastLoginAt ? formatDate(u.lastLoginAt, { dateStyle: "medium", timeStyle: "short" }) : "Never") },
        { header: "Status", cell: (u) => (u.active ? <Badge tone="green">Active</Badge> : <Badge tone="red">Disabled</Badge>) },
      ]}
    />
  );
}
