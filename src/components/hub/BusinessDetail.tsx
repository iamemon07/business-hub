"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink, KeyRound, Loader2, LogIn, Plus, Trash2 } from "lucide-react";
import { Badge, Field, Modal, PageHeader, Panel, StatCard, Toggle } from "@/components/admin/ui";
import { api } from "@/lib/client-api";
import { formatDate, formatPrice } from "@/lib/utils";
import type { BusinessRow } from "@/services/platform-stats";
import { STATE_TONES, STATUS_OPTIONS } from "./shared";

type TenantDoc = {
  _id: string;
  name: string;
  slug: string;
  status: string;
  plan?: string;
  billingCycle: "monthly" | "yearly";
  customPrice: number;
  trialEndsAt?: string;
  paidUntil?: string;
  customDomains: string[];
  owner: { name: string; email: string; phone: string };
  notes: string;
  showcase: boolean;
};
type PlanLite = { _id: string; name: string; priceMonthly: number; priceYearly: number; active: boolean };
type Payment = { _id: string; date: string; amount: number; method: string; reference: string; periodFrom?: string; periodTo?: string; note: string; recordedBy: string };
type AdminLite = { _id: string; name: string; email: string; role: string; active: boolean; lastLoginAt: string | null };

const toDate = (v?: string | null) => (v ? new Date(v).toISOString().slice(0, 10) : "");

export function BusinessDetail({
  row,
  tenant,
  plans,
  payments,
  admins,
  currency,
  templateName,
  platformDomain,
}: {
  row: BusinessRow;
  tenant: TenantDoc;
  plans: PlanLite[];
  payments: Payment[];
  admins: AdminLite[];
  currency: string;
  templateName: string;
  platformDomain: string;
}) {
  const router = useRouter();
  const m = (n: number) => formatPrice(n, currency);
  const [f, setF] = useState({
    name: tenant.name,
    status: tenant.status,
    planId: tenant.plan ?? "",
    billingCycle: tenant.billingCycle ?? "monthly",
    customPrice: tenant.customPrice ?? 0,
    trialEndsAt: toDate(tenant.trialEndsAt),
    paidUntil: toDate(tenant.paidUntil),
    customDomains: (tenant.customDomains ?? []).join(", "),
    owner: { name: tenant.owner?.name ?? "", email: tenant.owner?.email ?? "", phone: tenant.owner?.phone ?? "" },
    notes: tenant.notes ?? "",
    showcase: Boolean(tenant.showcase),
  });
  const [saving, setSaving] = useState(false);
  const [opening, setOpening] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [resetFor, setResetFor] = useState<AdminLite | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const plan = plans.find((p) => p._id === f.planId);
  const cyclePrice = f.customPrice || (f.billingCycle === "yearly" ? plan?.priceYearly : plan?.priceMonthly) || 0;

  const save = async () => {
    setSaving(true);
    try {
      await api(`/api/hub/businesses/${tenant._id}`, {
        method: "PUT",
        body: { ...f, customDomains: f.customDomains.split(/[\s,]+/).map((d) => d.trim()).filter(Boolean) },
      });
      toast.success("Business updated");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const openAdmin = async () => {
    setOpening(true);
    try {
      const { url } = await api<{ url: string }>(`/api/hub/businesses/${tenant._id}/access`, { method: "POST" });
      window.open(url, "_blank", "noopener");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setOpening(false);
    }
  };

  const removePayment = async (p: Payment) => {
    if (!confirm(`Delete the ${m(p.amount)} payment from ${formatDate(p.date)}? (Paid-until date is not changed.)`)) return;
    try {
      await api(`/api/hub/businesses/${tenant._id}/payments?paymentId=${p._id}`, { method: "DELETE" });
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div>
      <Link href="/console/businesses" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-rose"><ArrowLeft className="h-4 w-4" /> Businesses</Link>
      <PageHeader
        title={tenant.name}
        description={`${row.url.replace(/^https?:\/\//, "")} · ${templateName}`}
        actions={
          <>
            <a href={row.url} target="_blank" rel="noopener noreferrer" className="btn-outline"><ExternalLink className="h-4 w-4" /> Open Store</a>
            <button onClick={openAdmin} disabled={opening} className="btn-primary">
              {opening ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />} Open Store Admin
            </button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Status" value={row.state.label} sub={<Badge tone={STATE_TONES[row.state.key]}>{tenant.status}</Badge>} />
        <StatCard label="Sales · 30 days" value={m(row.last30.revenue)} sub={`${row.last30.orders} orders`} />
        <StatCard label="Lifetime sales" value={m(row.lifetime.revenue)} sub={`${row.lifetime.orders} orders · ${row.products} products`} />
        <StatCard label="Subscription" value={cyclePrice ? m(cyclePrice) : "—"} sub={`${plan?.name ?? "No plan"} · ${f.billingCycle}`} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Panel title="Business settings" actions={<button onClick={save} disabled={saving} className="btn-primary px-5 py-2">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save</button>}>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Business name"><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="input" /></Field>
              <Field label="Status" hint="Suspended = storefront offline, admin read-only.">
                <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} className="input">
                  {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
              <Field label="Plan">
                <select value={f.planId} onChange={(e) => setF({ ...f, planId: e.target.value })} className="input">
                  <option value="">— No plan —</option>
                  {plans.map((p) => <option key={p._id} value={p._id}>{p.name}{p.active ? "" : " (inactive)"}</option>)}
                </select>
              </Field>
              <Field label="Billing cycle">
                <select value={f.billingCycle} onChange={(e) => setF({ ...f, billingCycle: e.target.value as "monthly" | "yearly" })} className="input">
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </Field>
              <Field label="Custom price" hint="0 = use the plan price. Per billing cycle.">
                <input type="number" min={0} value={f.customPrice} onChange={(e) => setF({ ...f, customPrice: Number(e.target.value) })} className="input" />
              </Field>
              <Field label="Trial ends"><input type="date" value={f.trialEndsAt} onChange={(e) => setF({ ...f, trialEndsAt: e.target.value })} className="input" /></Field>
              <Field label="Paid until" hint="Extended automatically when you record a payment.">
                <input type="date" value={f.paidUntil} onChange={(e) => setF({ ...f, paidUntil: e.target.value })} className="input" />
              </Field>
              <Field label="Custom domains" hint={`Comma-separated. Customer adds a CNAME record pointing to ${platformDomain}.`}>
                <input value={f.customDomains} onChange={(e) => setF({ ...f, customDomains: e.target.value })} className="input" placeholder="shop.example.com" />
              </Field>
              <Field label="Owner name"><input value={f.owner.name} onChange={(e) => setF({ ...f, owner: { ...f.owner, name: e.target.value } })} className="input" /></Field>
              <Field label="Owner phone"><input value={f.owner.phone} onChange={(e) => setF({ ...f, owner: { ...f.owner, phone: e.target.value } })} className="input" /></Field>
              <Field label="Owner email" className="sm:col-span-2"><input type="email" value={f.owner.email} onChange={(e) => setF({ ...f, owner: { ...f.owner, email: e.target.value } })} className="input" /></Field>
              <Field label="Internal notes" className="sm:col-span-2">
                <textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} rows={3} className="input" />
              </Field>
              <div className="sm:col-span-2">
                <Toggle checked={f.showcase} onChange={(v) => setF({ ...f, showcase: v })} label="Showcase on landing page" description="List this store as a customer example on your public site." />
              </div>
            </div>
          </Panel>

          <Panel title="Subscription payments" actions={<button onClick={() => setPayOpen(true)} className="btn-soft px-4 py-2"><Plus className="h-3.5 w-3.5" /> Record Payment</button>}>
            {payments.length === 0 ? (
              <p className="text-sm text-muted">No payments recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-[11px] uppercase tracking-wider text-muted">
                    <tr><th className="py-2">Date</th><th>Amount</th><th>Method</th><th>Covers</th><th>Ref</th><th /></tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {payments.map((p) => (
                      <tr key={p._id}>
                        <td className="py-2.5">{formatDate(p.date)}</td>
                        <td className="font-medium">{m(p.amount)}</td>
                        <td className="capitalize">{p.method}</td>
                        <td className="text-xs">{p.periodFrom && p.periodTo ? `${formatDate(p.periodFrom)} – ${formatDate(p.periodTo)}` : "—"}</td>
                        <td className="text-xs text-muted">{p.reference || "—"}</td>
                        <td className="text-right">
                          <button onClick={() => removePayment(p)} className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600" aria-label="Delete payment"><Trash2 className="h-4 w-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Store team">
            <ul className="divide-y divide-line">
              {admins.map((a) => (
                <li key={a._id} className="flex items-center gap-3 py-2.5 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{a.name} <span className="text-xs capitalize text-muted">· {a.role}{a.active ? "" : " (inactive)"}</span></p>
                    <p className="truncate text-xs text-muted">{a.email}{a.lastLoginAt ? ` · last login ${formatDate(a.lastLoginAt)}` : " · never logged in"}</p>
                  </div>
                  <button onClick={() => setResetFor(a)} className="rounded-lg p-2 text-muted hover:bg-blush-100 hover:text-rose" aria-label={`Reset password for ${a.email}`} title="Reset password">
                    <KeyRound className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Danger zone">
            <p className="text-sm text-muted">Deleting removes the store and all of its products, orders, customers and settings. This cannot be undone.</p>
            <button onClick={() => setDeleteOpen(true)} className="btn mt-4 w-full border border-red-200 text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /> Delete Business</button>
          </Panel>
        </div>
      </div>

      <PaymentModal open={payOpen} onClose={() => setPayOpen(false)} tenantId={tenant._id} defaultAmount={cyclePrice} cycle={f.billingCycle} currency={currency} onSaved={() => router.refresh()} />
      <ResetPasswordModal admin={resetFor} onClose={() => setResetFor(null)} tenantId={tenant._id} />
      <DeleteModal open={deleteOpen} onClose={() => setDeleteOpen(false)} tenant={tenant} />
    </div>
  );
}

function PaymentModal({ open, onClose, tenantId, defaultAmount, cycle, currency, onSaved }: { open: boolean; onClose: () => void; tenantId: string; defaultAmount: number; cycle: string; currency: string; onSaved: () => void }) {
  const [p, setP] = useState({ date: new Date().toISOString().slice(0, 10), amount: defaultAmount, method: "bkash", reference: "", months: cycle === "yearly" ? 12 : 1, note: "" });
  const [saving, setSaving] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api(`/api/hub/businesses/${tenantId}/payments`, { method: "POST", body: p });
      toast.success("Payment recorded");
      onSaved();
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal open={open} onClose={onClose} title="Record payment">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Date"><input type="date" value={p.date} onChange={(e) => setP({ ...p, date: e.target.value })} className="input" required /></Field>
        <Field label={`Amount (${currency})`}><input type="number" min={0} value={p.amount} onChange={(e) => setP({ ...p, amount: Number(e.target.value) })} className="input" required /></Field>
        <Field label="Method">
          <select value={p.method} onChange={(e) => setP({ ...p, method: e.target.value })} className="input">
            {["bkash", "nagad", "rocket", "bank", "cash", "card", "other"].map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </Field>
        <Field label="Months covered" hint="Extends paid-until. 0 = one-off fee."><input type="number" min={0} max={36} value={p.months} onChange={(e) => setP({ ...p, months: Number(e.target.value) })} className="input" /></Field>
        <Field label="Reference / TrxID" className="sm:col-span-2"><input value={p.reference} onChange={(e) => setP({ ...p, reference: e.target.value })} className="input" /></Field>
        <Field label="Note" className="sm:col-span-2"><input value={p.note} onChange={(e) => setP({ ...p, note: e.target.value })} className="input" /></Field>
        <button disabled={saving} className="btn-primary sm:col-span-2">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save Payment</button>
      </form>
    </Modal>
  );
}

function ResetPasswordModal({ admin, onClose, tenantId }: { admin: AdminLite | null; onClose: () => void; tenantId: string }) {
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api(`/api/hub/businesses/${tenantId}/access`, { method: "PUT", body: { adminId: admin?._id, password } });
      toast.success(`Password reset for ${admin?.email}`);
      setPassword("");
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal open={Boolean(admin)} onClose={onClose} title="Reset password">
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-muted">Set a new password for <b>{admin?.email}</b> and share it with them.</p>
        <input value={password} onChange={(e) => setPassword(e.target.value)} className="input font-mono" minLength={8} placeholder="New password (min 8)" required />
        <button disabled={saving} className="btn-primary w-full">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Reset Password</button>
      </form>
    </Modal>
  );
}

function DeleteModal({ open, onClose, tenant }: { open: boolean; onClose: () => void; tenant: TenantDoc }) {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api(`/api/hub/businesses/${tenant._id}`, { method: "DELETE", body: { confirm: confirmText } });
      toast.success(`${tenant.name} deleted`);
      router.replace("/console/businesses");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
      setBusy(false);
    }
  };
  return (
    <Modal open={open} onClose={onClose} title={`Delete ${tenant.name}?`}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-muted">All products, orders, pages and settings of this business will be permanently deleted. Type <b>{tenant.slug}</b> to confirm.</p>
        <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} className="input" placeholder={tenant.slug} />
        <button disabled={busy || confirmText !== tenant.slug} className="btn w-full bg-red-600 text-white hover:bg-red-700">{busy && <Loader2 className="h-4 w-4 animate-spin" />} Delete permanently</button>
      </form>
    </Modal>
  );
}
