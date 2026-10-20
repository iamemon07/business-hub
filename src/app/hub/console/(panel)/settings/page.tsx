"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Field, Modal, PageHeader, Panel, Toggle } from "@/components/admin/ui";
import { api } from "@/lib/client-api";
import type { PlatformSettingsDTO } from "@/services/platform";

type SuperAdmin = { _id: string; name: string; email: string; lastLoginAt?: string };

export default function PlatformSettingsPage() {
  const [s, setS] = useState<PlatformSettingsDTO | null>(null);
  const [saving, setSaving] = useState(false);
  const [admins, setAdmins] = useState<SuperAdmin[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: "", email: "", password: "" });
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });

  const loadAdmins = useCallback(() => api<SuperAdmin[]>("/api/hub/admins").then(setAdmins).catch(() => {}), []);
  useEffect(() => {
    api<PlatformSettingsDTO>("/api/hub/settings").then(setS).catch((e) => toast.error(e.message));
    loadAdmins();
  }, [loadAdmins]);

  if (!s) return <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-rose" /></div>;

  const save = async () => {
    setSaving(true);
    try {
      const { name, tagline, currencySymbol, supportEmail, supportPhone, whatsapp, hero, leadsEnabled, trialDays } = s;
      await api("/api/hub/settings", { method: "PUT", body: { name, tagline, currencySymbol, supportEmail, supportPhone, whatsapp, hero, leadsEnabled, trialDays } });
      toast.success("Platform settings saved");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const addAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api("/api/hub/admins", { method: "POST", body: newAdmin });
      toast.success("Super admin added");
      setAddOpen(false);
      setNewAdmin({ name: "", email: "", password: "" });
      loadAdmins();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api("/api/hub/admins", { method: "PUT", body: pw });
      toast.success("Password changed");
      setPw({ currentPassword: "", newPassword: "" });
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const input = (key: keyof PlatformSettingsDTO, label: string, hint?: string) => (
    <Field label={label} hint={hint}>
      <input value={String(s[key] ?? "")} onChange={(e) => setS({ ...s, [key]: e.target.value })} className="input" />
    </Field>
  );

  return (
    <div>
      <PageHeader
        title="Platform Settings"
        description="Your platform's brand, public landing page and defaults for new businesses."
        actions={<button onClick={save} disabled={saving} className="btn-primary">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save Changes</button>}
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Brand & contact">
          <div className="grid gap-5 sm:grid-cols-2">
            {input("name", "Platform name")}
            {input("tagline", "Tagline")}
            {input("supportPhone", "Support phone", "Shown to store owners on their Subscription page")}
            {input("whatsapp", "WhatsApp")}
            {input("supportEmail", "Support email", "Also receives new lead alerts")}
            {input("currencySymbol", "Currency symbol")}
          </div>
        </Panel>
        <Panel title="Landing page & signups">
          <div className="grid gap-5">
            <Field label="Hero title"><input value={s.hero.title} onChange={(e) => setS({ ...s, hero: { ...s.hero, title: e.target.value } })} className="input" /></Field>
            <Field label="Hero subtitle"><textarea value={s.hero.subtitle} onChange={(e) => setS({ ...s, hero: { ...s.hero, subtitle: e.target.value } })} rows={3} className="input" /></Field>
            <Field label="Default trial (days)"><input type="number" min={0} max={365} value={s.trialDays} onChange={(e) => setS({ ...s, trialDays: Number(e.target.value) })} className="input" /></Field>
            <Toggle checked={s.leadsEnabled} onChange={(v) => setS({ ...s, leadsEnabled: v })} label="Accept store requests" description="Show the “Start your store” form on the landing page." />
          </div>
        </Panel>
        <Panel title="Super admins" actions={<button onClick={() => setAddOpen(true)} className="btn-soft px-4 py-2"><Plus className="h-3.5 w-3.5" /> Add</button>}>
          <ul className="divide-y divide-line">
            {admins.map((a) => (
              <li key={a._id} className="flex items-center gap-3 py-2.5 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{a.name}</p>
                  <p className="text-xs text-muted">{a.email}</p>
                </div>
                <button
                  onClick={async () => {
                    if (!confirm(`Remove ${a.email}?`)) return;
                    await api(`/api/hub/admins?id=${a._id}`, { method: "DELETE" }).catch((e) => toast.error(e.message));
                    loadAdmins();
                  }}
                  className="rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-600"
                  aria-label={`Remove ${a.email}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Change my password">
          <form onSubmit={changePassword} className="grid gap-4">
            <input type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} placeholder="Current password" className="input" required />
            <input type="password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} placeholder="New password (min 8)" minLength={8} className="input" required />
            <button className="btn-primary">Update Password</button>
          </form>
        </Panel>
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add super admin">
        <form onSubmit={addAdmin} className="space-y-4">
          <input value={newAdmin.name} onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })} placeholder="Name" className="input" required />
          <input type="email" value={newAdmin.email} onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })} placeholder="Email" className="input" required />
          <input value={newAdmin.password} onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })} placeholder="Password (min 8)" minLength={8} className="input" required />
          <button className="btn-primary w-full">Add Super Admin</button>
        </form>
      </Modal>
    </div>
  );
}
