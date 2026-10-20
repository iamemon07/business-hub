"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge, EmptyState, Field, Modal, PageHeader, Toggle } from "@/components/admin/ui";
import { api } from "@/lib/client-api";

type Plan = {
  _id?: string;
  name: string;
  key: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  limits: { products: number; staff: number; customDomain: boolean };
  features: string[];
  public: boolean;
  sortOrder: number;
  active: boolean;
};

const EMPTY: Plan = {
  name: "",
  key: "",
  description: "",
  priceMonthly: 0,
  priceYearly: 0,
  limits: { products: 0, staff: 0, customDomain: false },
  features: [],
  public: true,
  sortOrder: 0,
  active: true,
};

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => api<Plan[]>("/api/hub/plans").then(setPlans).catch((e) => toast.error(e.message)), []);
  useEffect(() => void load(), [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      const { _id, ...body } = editing;
      await api(_id ? `/api/hub/plans/${_id}` : "/api/hub/plans", { method: _id ? "PUT" : "POST", body });
      toast.success("Plan saved");
      setEditing(null);
      load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p: Plan) => {
    if (!confirm(`Delete the ${p.name} plan?`)) return;
    try {
      await api(`/api/hub/plans/${p._id}`, { method: "DELETE" });
      load();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const lim = (n: number) => (n ? n.toLocaleString() : "Unlimited");

  return (
    <div>
      <PageHeader
        title="Plans & Pricing"
        description="What you charge businesses and what each plan includes. Limits are enforced inside each store."
        actions={<button onClick={() => setEditing({ ...EMPTY })} className="btn-primary"><Plus className="h-4 w-4" /> New Plan</button>}
      />
      {!plans ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-rose" /></div>
      ) : plans.length === 0 ? (
        <EmptyState title="No plans yet" text="Create plans like Starter, Growth and Pro to sell your platform." action={<button onClick={() => setEditing({ ...EMPTY })} className="btn-primary">New Plan</button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((p) => (
            <div key={p._id} className="flex flex-col rounded-2xl border border-line bg-white p-6">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-lg font-semibold">{p.name}</p>
                  <p className="text-xs text-muted">{p.key}</p>
                </div>
                <div className="flex gap-1">
                  {!p.active && <Badge tone="neutral">inactive</Badge>}
                  {!p.public && <Badge tone="amber">hidden</Badge>}
                </div>
              </div>
              <p className="mt-4 text-3xl font-semibold">৳{p.priceMonthly.toLocaleString()}<span className="text-sm font-normal text-muted"> /month</span></p>
              <p className="text-xs text-muted">৳{p.priceYearly.toLocaleString()} /year</p>
              <ul className="mt-4 space-y-1 text-sm text-cocoa-light">
                <li>{lim(p.limits.products)} products</li>
                <li>{lim(p.limits.staff)} team members</li>
                <li>{p.limits.customDomain ? "Custom domain included" : "Subdomain only"}</li>
                {p.features.map((f) => <li key={f}>{f}</li>)}
              </ul>
              <div className="mt-auto flex gap-2 pt-6">
                <button onClick={() => setEditing(p)} className="btn-soft flex-1 px-4 py-2"><Pencil className="h-3.5 w-3.5" /> Edit</button>
                <button onClick={() => remove(p)} className="rounded-full p-2 text-muted hover:bg-red-50 hover:text-red-600" aria-label="Delete plan"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing?._id ? "Edit plan" : "New plan"} wide>
        {editing && (
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            <Field label="Name"><input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value, key: editing._id ? editing.key : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") })} className="input" required /></Field>
            <Field label="Key" hint="Internal identifier"><input value={editing.key} onChange={(e) => setEditing({ ...editing, key: e.target.value })} className="input" required /></Field>
            <Field label="Description" className="sm:col-span-2"><input value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="input" /></Field>
            <Field label="Price / month"><input type="number" min={0} value={editing.priceMonthly} onChange={(e) => setEditing({ ...editing, priceMonthly: Number(e.target.value) })} className="input" /></Field>
            <Field label="Price / year"><input type="number" min={0} value={editing.priceYearly} onChange={(e) => setEditing({ ...editing, priceYearly: Number(e.target.value) })} className="input" /></Field>
            <Field label="Max products" hint="0 = unlimited"><input type="number" min={0} value={editing.limits.products} onChange={(e) => setEditing({ ...editing, limits: { ...editing.limits, products: Number(e.target.value) } })} className="input" /></Field>
            <Field label="Max team members" hint="0 = unlimited"><input type="number" min={0} value={editing.limits.staff} onChange={(e) => setEditing({ ...editing, limits: { ...editing.limits, staff: Number(e.target.value) } })} className="input" /></Field>
            <Field label="Feature bullets" hint="One per line — shown on pricing" className="sm:col-span-2">
              <textarea value={editing.features.join("\n")} onChange={(e) => setEditing({ ...editing, features: e.target.value.split("\n").map((x) => x.trim()).filter(Boolean) })} rows={4} className="input" />
            </Field>
            <Field label="Sort order"><input type="number" value={editing.sortOrder} onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })} className="input" /></Field>
            <div className="space-y-3 pt-6">
              <Toggle checked={editing.limits.customDomain} onChange={(v) => setEditing({ ...editing, limits: { ...editing.limits, customDomain: v } })} label="Custom domain" />
              <Toggle checked={editing.public} onChange={(v) => setEditing({ ...editing, public: v })} label="Show on pricing page" />
              <Toggle checked={editing.active} onChange={(v) => setEditing({ ...editing, active: v })} label="Active" />
            </div>
            <button disabled={saving} className="btn-primary sm:col-span-2">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save Plan</button>
          </form>
        )}
      </Modal>
    </div>
  );
}
