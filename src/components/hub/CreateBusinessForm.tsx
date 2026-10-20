"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, Copy, ExternalLink, KeyRound, Loader2, RefreshCw, Store, X } from "lucide-react";
import { Field, Panel } from "@/components/admin/ui";
import { api } from "@/lib/client-api";
import { cn, slugify } from "@/lib/utils";
import type { ThemeDTO } from "@/types";

type TemplateSummary = { key: string; name: string; description: string; examples: string; theme: ThemeDTO };

function randomPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint32Array(12));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export function CreateBusinessForm({
  templates,
  plans,
  domain,
  protocol,
  defaults,
  lead,
}: {
  templates: TemplateSummary[];
  plans: { _id: string; name: string; priceMonthly: number }[];
  domain: string;
  protocol: string;
  defaults: { currency: string; trialDays: number };
  lead: { _id: string; name: string; businessName: string; email: string; phone: string; template: string } | null;
}) {
  const initialTemplate = templates.find((t) => t.key === lead?.template) ?? templates[0];
  const [f, setF] = useState({
    name: lead?.businessName ?? "",
    slug: lead?.businessName ? slugify(lead.businessName) : "",
    template: initialTemplate.key,
    primary: initialTemplate.theme.primary,
    accent: initialTemplate.theme.accent,
    background: initialTemplate.theme.background,
    ownerName: lead?.name ?? "",
    ownerEmail: lead?.email ?? "",
    ownerPhone: lead?.phone ?? "",
    ownerPassword: "",
    planId: plans[0]?._id ?? "",
    status: "trial" as "trial" | "active",
    trialDays: defaults.trialDays,
    currencySymbol: defaults.currency,
  });
  const [slugTouched, setSlugTouched] = useState(Boolean(lead?.businessName));
  const [slugCheck, setSlugCheck] = useState<{ available: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<{ id: string; storeUrl: string; adminUrl: string; email: string; password: string } | null>(null);

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));

  useEffect(() => setF((s) => (s.ownerPassword ? s : { ...s, ownerPassword: randomPassword() })), []);

  // Debounced availability check for the store address.
  useEffect(() => {
    if (!f.slug) return setSlugCheck(null);
    const t = setTimeout(() => {
      api<{ available: boolean; message: string }>(`/api/hub/check-slug?slug=${encodeURIComponent(f.slug)}`)
        .then(setSlugCheck)
        .catch(() => setSlugCheck(null));
    }, 350);
    return () => clearTimeout(t);
  }, [f.slug]);

  const pickTemplate = (t: TemplateSummary) =>
    setF((s) => ({ ...s, template: t.key, primary: t.theme.primary, accent: t.theme.accent, background: t.theme.background }));

  const storeUrl = `${protocol}://${f.slug || "your-store"}.${domain}`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (slugCheck && !slugCheck.available) return toast.error(slugCheck.message);
    setSaving(true);
    try {
      const res = await api<{ _id: string; slug: string }>("/api/hub/businesses", {
        method: "POST",
        body: {
          name: f.name,
          slug: f.slug,
          template: f.template,
          ownerName: f.ownerName,
          ownerEmail: f.ownerEmail,
          ownerPhone: f.ownerPhone,
          ownerPassword: f.ownerPassword,
          planId: f.planId,
          status: f.status,
          trialDays: f.trialDays,
          currencySymbol: f.currencySymbol,
          theme: { primary: f.primary, accent: f.accent, background: f.background },
          leadId: lead?._id,
        },
      });
      const url = `${protocol}://${res.slug}.${domain}`;
      setCreated({ id: res._id, storeUrl: url, adminUrl: `${url}/admin/login`, email: f.ownerEmail, password: f.ownerPassword });
      toast.success(`${f.name} is live!`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (created) {
    const credentials = `Store: ${created.storeUrl}\nAdmin: ${created.adminUrl}\nEmail: ${created.email}\nPassword: ${created.password}`;
    return (
      <Panel>
        <div className="flex flex-col items-center py-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><Check className="h-8 w-8" /></div>
          <h2 className="mt-4 text-2xl font-semibold">{f.name} is ready</h2>
          <p className="mt-1 text-sm text-muted">Share these login details with the owner. They can change the password after signing in.</p>
          <pre className="mt-6 w-full max-w-lg whitespace-pre-wrap rounded-xl bg-blush-50 p-4 text-left text-sm">{credentials}</pre>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              className="btn-soft"
              onClick={() => navigator.clipboard.writeText(credentials).then(() => toast.success("Copied"))}
            >
              <Copy className="h-4 w-4" /> Copy details
            </button>
            <a href={created.storeUrl} target="_blank" rel="noopener noreferrer" className="btn-outline"><ExternalLink className="h-4 w-4" /> Open store</a>
            <Link href={`/console/businesses/${created.id}`} className="btn-primary"><Store className="h-4 w-4" /> Manage business</Link>
          </div>
        </div>
      </Panel>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <Panel title="1. Business">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Business name *">
              <input
                value={f.name}
                onChange={(e) => {
                  set("name", e.target.value);
                  if (!slugTouched) set("slug", slugify(e.target.value).slice(0, 40));
                }}
                className="input"
                placeholder="e.g. Sunrise Fashion"
                required
              />
            </Field>
            <Field label="Store address *" hint={storeUrl}>
              <div className="relative">
                <input
                  value={f.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                  }}
                  className="input pr-9"
                  placeholder="sunrise"
                  required
                />
                {slugCheck && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2" title={slugCheck.message}>
                    {slugCheck.available ? <Check className="h-4 w-4 text-emerald-600" /> : <X className="h-4 w-4 text-red-600" />}
                  </span>
                )}
              </div>
              {slugCheck && !slugCheck.available && <p className="mt-1 text-xs text-red-600">{slugCheck.message}</p>}
            </Field>
          </div>
        </Panel>

        <Panel title="2. Niche template">
          <p className="mb-4 text-sm text-muted">Pre-fills colors, wording, product fields, categories and policy pages. Everything stays editable later.</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((t) => (
              <button
                type="button"
                key={t.key}
                onClick={() => pickTemplate(t)}
                className={cn(
                  "rounded-2xl border p-4 text-left transition",
                  f.template === t.key ? "border-cocoa ring-2 ring-cocoa/10" : "border-line hover:border-rose",
                )}
              >
                <div className="mb-3 flex gap-1.5">
                  {[t.theme.primary, t.theme.accent, t.theme.background].map((c) => (
                    <span key={c} className="h-5 w-5 rounded-full border border-black/10" style={{ background: c }} />
                  ))}
                </div>
                <p className="font-medium">{t.name}</p>
                <p className="mt-1 text-xs text-muted">{t.examples}</p>
              </button>
            ))}
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {(["primary", "accent", "background"] as const).map((k) => (
              <Field key={k} label={`${k} color`}>
                <div className="flex items-center gap-2">
                  <input type="color" value={f[k]} onChange={(e) => set(k, e.target.value)} className="h-11 w-14 shrink-0 cursor-pointer rounded-lg border border-line bg-white p-1" aria-label={`${k} color`} />
                  <input value={f[k]} onChange={(e) => set(k, e.target.value)} className="input font-mono" maxLength={7} />
                </div>
              </Field>
            ))}
          </div>
        </Panel>

        <Panel title="3. Owner login">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Owner name *"><input value={f.ownerName} onChange={(e) => set("ownerName", e.target.value)} className="input" required /></Field>
            <Field label="Phone"><input value={f.ownerPhone} onChange={(e) => set("ownerPhone", e.target.value)} className="input" placeholder="01XXXXXXXXX" /></Field>
            <Field label="Login email *"><input type="email" value={f.ownerEmail} onChange={(e) => set("ownerEmail", e.target.value)} className="input" required /></Field>
            <Field label="Password *" hint="Min 8 characters. Shown once after creation so you can share it.">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input value={f.ownerPassword} onChange={(e) => set("ownerPassword", e.target.value)} className="input pl-9 font-mono" minLength={8} required />
                </div>
                <button type="button" onClick={() => set("ownerPassword", randomPassword())} className="btn-soft px-3" aria-label="Generate password"><RefreshCw className="h-4 w-4" /></button>
              </div>
            </Field>
          </div>
        </Panel>
      </div>

      <div className="space-y-6">
        <Panel title="4. Plan & billing">
          <div className="space-y-5">
            <Field label="Plan">
              <select value={f.planId} onChange={(e) => set("planId", e.target.value)} className="input">
                <option value="">— No plan —</option>
                {plans.map((p) => <option key={p._id} value={p._id}>{p.name} · {defaults.currency}{p.priceMonthly}/mo</option>)}
              </select>
            </Field>
            <Field label="Start as">
              <select value={f.status} onChange={(e) => set("status", e.target.value as "trial" | "active")} className="input">
                <option value="trial">Free trial</option>
                <option value="active">Active (paid)</option>
              </select>
            </Field>
            {f.status === "trial" && (
              <Field label="Trial length (days)">
                <input type="number" min={0} max={365} value={f.trialDays} onChange={(e) => set("trialDays", Number(e.target.value))} className="input" />
              </Field>
            )}
            <Field label="Store currency symbol">
              <input value={f.currencySymbol} onChange={(e) => set("currencySymbol", e.target.value)} className="input" maxLength={5} />
            </Field>
          </div>
        </Panel>
        <button disabled={saving} className="btn-primary w-full py-4">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Store className="h-4 w-4" />} Create Business
        </button>
      </div>
    </form>
  );
}
