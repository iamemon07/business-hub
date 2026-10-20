"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Field, ImageInput, PageHeader, Panel, Toggle } from "@/components/admin/ui";
import { api } from "@/lib/client-api";
import { cn } from "@/lib/utils";
import type { SettingsDTO, WalletDTO } from "@/types";

const TABS = [
  { key: "general", label: "Brand & Contact" },
  { key: "look", label: "Look & Feel" },
  { key: "catalog", label: "Catalog Setup" },
  { key: "home", label: "Homepage" },
  { key: "shipping", label: "Shipping & Delivery" },
  { key: "payments", label: "Payments" },
  { key: "seo", label: "Orders, Invoice & SEO" },
  { key: "account", label: "My Account" },
] as const;

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function SettingsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("general");
  const [s, setS] = useState<SettingsDTO | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<SettingsDTO>("/api/admin/settings").then(setS).catch((e) => toast.error(e.message));
  }, []);

  if (!s) return <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-rose" /></div>;

  /** Immutable nested setter: up("shipping.insideFee", 80) */
  const up = (path: string, value: unknown) =>
    setS((prev) => {
      const next = structuredClone(prev!) as unknown as Record<string, unknown>;
      const keys = path.split(".");
      let cur = next;
      for (const k of keys.slice(0, -1)) cur = cur[k] as Record<string, unknown>;
      cur[keys.at(-1)!] = value;
      return next as unknown as SettingsDTO;
    });

  const save = async () => {
    setSaving(true);
    try {
      const { storeName, tagline, logo, currencySymbol, wordmark, scriptLines, theme, catalog, email, phone, whatsapp, address, social, announcement, home, shipping, payments, orders, invoice, seo, footerAbout } = s;
      await api("/api/admin/settings", {
        method: "PUT",
        body: { storeName, tagline, logo, currencySymbol, wordmark, scriptLines, theme, catalog, email, phone, whatsapp, address, social, announcement, home, shipping, payments, orders, invoice, seo, footerAbout },
      });
      toast.success("Settings saved — your store is updated");
      // Theme colors are applied server-side, so reload to see them in the admin too.
      if (tab === "look") window.location.reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const text = (path: string, label: string, props: { hint?: string; placeholder?: string; type?: string; className?: string } = {}) => {
    const value = path.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], s);
    return (
      <Field label={label} hint={props.hint} className={props.className}>
        <input
          type={props.type ?? "text"}
          value={String(value ?? "")}
          placeholder={props.placeholder}
          onChange={(e) => up(path, props.type === "number" ? Number(e.target.value) : e.target.value)}
          className="input"
        />
      </Field>
    );
  };
  const area = (path: string, label: string, rows = 3, hint?: string) => {
    const value = path.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], s);
    return (
      <Field label={label} hint={hint} className="sm:col-span-2">
        <textarea value={String(value ?? "")} onChange={(e) => up(path, e.target.value)} rows={rows} className="input" />
      </Field>
    );
  };

  const wallet = (key: "bkash" | "nagad" | "rocket", label: string) => {
    const w: WalletDTO = s.payments[key];
    return (
      <Panel title={label} actions={<Toggle checked={w.enabled} onChange={(v) => up(`payments.${key}.enabled`, v)} />}>
        <div className={cn("grid gap-5 sm:grid-cols-2", !w.enabled && "opacity-50")}>
          {text(`payments.${key}.number`, `${label} Number`, { placeholder: "01XXXXXXXXX" })}
          <Field label="Account Type">
            <select value={w.accountType} onChange={(e) => up(`payments.${key}.accountType`, e.target.value)} className="input">
              <option>Personal</option><option>Merchant</option><option>Agent</option>
            </select>
          </Field>
          {area(`payments.${key}.instructions`, "Instructions shown at checkout", 2)}
        </div>
      </Panel>
    );
  };

  return (
    <div>
      <PageHeader
        title="Site Settings"
        description="Control your entire storefront content and business rules from here."
        actions={tab !== "account" && <button onClick={save} disabled={saving} className="btn-primary">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save Changes</button>}
      />

      <div className="no-scrollbar mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-line bg-white p-1.5">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn("shrink-0 rounded-xl px-4 py-2 text-sm transition", tab === t.key ? "bg-cocoa text-ivory" : "text-cocoa-light hover:bg-blush-50")}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "general" && (
        <div className="space-y-6">
          <Panel title="Brand">
            <div className="grid gap-5 sm:grid-cols-2">
              {text("storeName", "Store Name")}
              {text("tagline", "Tagline")}
              {text("currencySymbol", "Currency Symbol", { hint: "e.g. ৳ or Tk" })}
              <Field label="Logo" className="sm:col-span-2"><ImageInput value={s.logo} onChange={(v) => up("logo", v)} aspect="aspect-square max-w-[140px]" /></Field>
              {area("footerAbout", "Footer About Text", 2)}
            </div>
          </Panel>
          <Panel title="Announcement Bar" actions={<Toggle checked={s.announcement.enabled} onChange={(v) => up("announcement.enabled", v)} />}>
            <div className="grid gap-5 sm:grid-cols-2">
              {text("announcement.text", "Text", { className: "sm:col-span-2" })}
              {text("announcement.link", "Link", { placeholder: "/shop" })}
            </div>
          </Panel>
          <Panel title="Contact">
            <div className="grid gap-5 sm:grid-cols-2">
              {text("phone", "Phone")}
              {text("email", "Email", { type: "email" })}
              {text("whatsapp", "WhatsApp Number", { placeholder: "8801XXXXXXXXX" })}
              {text("address", "Address")}
            </div>
          </Panel>
          <Panel title="Social Links">
            <div className="grid gap-5 sm:grid-cols-2">
              {text("social.facebook", "Facebook URL")}
              {text("social.instagram", "Instagram URL")}
              {text("social.tiktok", "TikTok URL")}
              {text("social.youtube", "YouTube URL")}
            </div>
          </Panel>
        </div>
      )}

      {tab === "look" && (
        <div className="space-y-6">
          <Panel title="Brand Colors">
            <div className="grid gap-5 sm:grid-cols-3">
              {(
                [
                  ["primary", "Primary", "Text, buttons, header bar"],
                  ["accent", "Accent", "Highlights, badges, links"],
                  ["background", "Background", "Page background"],
                ] as const
              ).map(([key, label, hint]) => {
                const value = s.theme[key];
                return (
                  <Field key={key} label={label} hint={hint}>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"}
                        onChange={(e) => up(`theme.${key}`, e.target.value)}
                        className="h-11 w-14 shrink-0 cursor-pointer rounded-lg border border-line bg-white p-1"
                        aria-label={`${label} color`}
                      />
                      <input value={value} onChange={(e) => up(`theme.${key}`, e.target.value.trim())} className="input font-mono" maxLength={7} />
                    </div>
                  </Field>
                );
              })}
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-line p-4" style={{ background: s.theme.background }}>
              <span className="rounded-full px-5 py-2 text-xs uppercase tracking-widest text-white" style={{ background: s.theme.primary }}>Primary button</span>
              <span className="rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ background: s.theme.accent }}>−20%</span>
              <span className="font-display text-2xl" style={{ color: s.theme.primary }}>{s.storeName}</span>
            </div>
          </Panel>
          <Panel title="Typography">
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["elegant", "Elegant", "Serif headings with a handwritten accent — fashion, decor, beauty", "var(--font-cormorant)"],
                  ["modern", "Modern", "Clean sans-serif everywhere — electronics, grocery, general", "var(--font-jost)"],
                ] as const
              ).map(([key, label, hint, family]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => up("theme.font", key)}
                  className={cn("rounded-xl border p-4 text-left transition", s.theme.font === key ? "border-cocoa bg-blush-50" : "border-line hover:border-rose")}
                >
                  <p className="text-2xl" style={{ fontFamily: family }}>{label}</p>
                  <p className="mt-1 text-xs text-muted">{hint}</p>
                </button>
              ))}
            </div>
          </Panel>
          <Panel title="Text Logo & Accent Lines">
            <div className="grid gap-5 sm:grid-cols-2">
              {text("wordmark.main", "Wordmark (big)", { placeholder: s.storeName.split(" ")[0]?.toUpperCase(), hint: "Shown next to the logo. Empty = first word of your store name." })}
              {text("wordmark.sub", "Wordmark (small)", { placeholder: "e.g. HOME DECOR" })}
              {text("scriptLines.header", "Mobile menu accent line", { placeholder: "e.g. Style that feels like you" })}
              {text("scriptLines.footer", "Footer accent line", { placeholder: "e.g. Made with love" })}
            </div>
          </Panel>
        </div>
      )}

      {tab === "catalog" && (
        <div className="space-y-6">
          <Panel title="Words Your Store Uses">
            <div className="grid gap-5 sm:grid-cols-3">
              {text("catalog.variantLabel", "Variant label", { hint: "Size, Option, Storage, Weight…" })}
              {text("catalog.itemNoun", "Item (singular)", { hint: "piece, item, product" })}
              {text("catalog.itemNounPlural", "Items (plural)")}
              {text("catalog.cartLabel", "Cart name", { hint: "Bag, Cart, Basket" })}
              {text("catalog.careTabLabel", "Care tab title", { hint: "e.g. Fabric & Care, Warranty" })}
              <Field label="Product image shape">
                <select value={s.catalog.imageAspect} onChange={(e) => up("catalog.imageAspect", e.target.value)} className="input">
                  <option value="3/4">Portrait 3:4 (fashion)</option>
                  <option value="4/5">Portrait 4:5 (decor, beauty)</option>
                  <option value="1/1">Square 1:1 (electronics, grocery)</option>
                </select>
              </Field>
              {area("catalog.defaultCare", "Default care / usage text", 2, "Shown when a product has no care text of its own.")}
            </div>
          </Panel>
          <Panel title="Product Specifications & Shop Filter">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Specification fields" hint="Comma-separated. Offered on every new product, e.g. Material, Dimensions." className="sm:col-span-2">
                <input
                  value={s.catalog.specFields.join(", ")}
                  onChange={(e) => up("catalog.specFields", e.target.value.split(",").map((x) => x.trim()).filter(Boolean))}
                  className="input"
                />
              </Field>
              <Field label="Filter by" hint="Which specification customers can filter the shop by. Empty = no filter.">
                <select value={s.catalog.filterSpec} onChange={(e) => up("catalog.filterSpec", e.target.value)} className="input">
                  <option value="">— No filter —</option>
                  {s.catalog.specFields.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </Field>
              <Field label="Filter values" hint="Comma-separated, e.g. Cotton, Linen, Silk">
                <input
                  value={s.catalog.filterValues.join(", ")}
                  onChange={(e) => up("catalog.filterValues", e.target.value.split(",").map((x) => x.trim()).filter(Boolean))}
                  className="input"
                />
              </Field>
            </div>
          </Panel>
          <Panel
            title={`${s.catalog.variantLabel} Presets`}
            actions={
              <button type="button" onClick={() => up("catalog.variantPresets", [...s.catalog.variantPresets, { name: "New preset", options: ["Option 1"] }])} className="btn-soft px-4 py-2">
                <Plus className="h-3.5 w-3.5" /> Add Preset
              </button>
            }
          >
            <p className="mb-4 text-xs text-muted">One-click option sets on the product form (comma-separated values).</p>
            <div className="space-y-3">
              {s.catalog.variantPresets.map((p, i) => (
                <div key={i} className="grid gap-2 sm:grid-cols-[200px_1fr_auto]">
                  <input
                    value={p.name}
                    onChange={(e) => up("catalog.variantPresets", s.catalog.variantPresets.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))}
                    placeholder="Preset name"
                    className="input"
                  />
                  <input
                    value={p.options.join(", ")}
                    onChange={(e) =>
                      up("catalog.variantPresets", s.catalog.variantPresets.map((x, k) => (k === i ? { ...x, options: e.target.value.split(",").map((o) => o.trim()).filter(Boolean) } : x)))
                    }
                    placeholder="S, M, L"
                    className="input"
                  />
                  <button type="button" onClick={() => up("catalog.variantPresets", s.catalog.variantPresets.filter((_, k) => k !== i))} className="rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-600" aria-label="Remove preset">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {tab === "home" && (
        <div className="space-y-6">
          <Panel title="Section Titles">
            <div className="grid gap-5 sm:grid-cols-2">
              {text("home.categoriesTitle", "Categories Title")}
              <span className="hidden sm:block" />
              {text("home.newArrivalsTitle", "New Arrivals Title")}
              {text("home.newArrivalsSubtitle", "New Arrivals Subtitle")}
              {text("home.bestSellersTitle", "Best Sellers Title")}
              {text("home.bestSellersSubtitle", "Best Sellers Subtitle")}
            </div>
          </Panel>
          <Panel title="Brand Story Section">
            <div className="grid gap-5 sm:grid-cols-2">
              {text("home.storyTitle", "Title", { className: "sm:col-span-2" })}
              {area("home.storyText", "Text", 4)}
              <Field label="Image" className="sm:col-span-2"><ImageInput value={s.home.storyImage} onChange={(v) => up("home.storyImage", v)} /></Field>
            </div>
          </Panel>
          <Panel
            title="Feature Highlights"
            actions={s.home.features.length < 6 && (
              <button onClick={() => up("home.features", [...s.home.features, { title: "", text: "" }])} className="btn-soft px-3 py-1.5"><Plus className="h-3.5 w-3.5" /> Add</button>
            )}
          >
            <div className="space-y-3">
              {s.home.features.map((f, i) => (
                <div key={i} className="flex gap-2">
                  <input value={f.title} onChange={(e) => up("home.features", s.home.features.map((x, k) => (k === i ? { ...x, title: e.target.value } : x)))} placeholder="Title" className="input" />
                  <input value={f.text} onChange={(e) => up("home.features", s.home.features.map((x, k) => (k === i ? { ...x, text: e.target.value } : x)))} placeholder="Description" className="input" />
                  <button onClick={() => up("home.features", s.home.features.filter((_, k) => k !== i))} className="rounded-lg p-2 text-muted hover:text-red-600" aria-label="Remove"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </Panel>
          <p className="text-sm text-muted">Hero slider images are managed under <Link href="/admin/banners" className="text-rose underline">Banners</Link>. New Arrivals & Best Sellers are picked from products you flag in <Link href="/admin/products" className="text-rose underline">Products</Link>.</p>
        </div>
      )}

      {tab === "shipping" && (
        <div className="space-y-6">
          <Panel title="Delivery Charges">
            <div className="grid gap-5 sm:grid-cols-2">
              {text("shipping.insideCityLabel", "Zone 1 Label")}
              {text("shipping.insideFee", "Zone 1 Fee", { type: "number" })}
              {text("shipping.outsideCityLabel", "Zone 2 Label")}
              {text("shipping.outsideFee", "Zone 2 Fee", { type: "number" })}
              {text("shipping.freeShippingThreshold", "Free Delivery Above", { type: "number", hint: "0 = never free" })}
            </div>
          </Panel>
          <Panel title="Estimated Delivery Time">
            <div className="grid gap-5 sm:grid-cols-2">
              {text("shipping.minDays", "Minimum Working Days", { type: "number" })}
              {text("shipping.maxDays", "Maximum Working Days", { type: "number" })}
              <Field label="Weekend (non-working) Days" className="sm:col-span-2" hint="Skipped when calculating the estimated delivery date on invoices.">
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((d, i) => {
                    const on = s.shipping.weekendDays.includes(i);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => up("shipping.weekendDays", on ? s.shipping.weekendDays.filter((x) => x !== i) : [...s.shipping.weekendDays, i])}
                        className={cn("rounded-full border px-4 py-2 text-sm", on ? "border-cocoa bg-cocoa text-ivory" : "border-line bg-white")}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </Field>
            </div>
          </Panel>
        </div>
      )}

      {tab === "payments" && (
        <div className="space-y-6">
          <Panel title="Cash on Delivery" actions={<Toggle checked={s.payments.cod.enabled} onChange={(v) => up("payments.cod.enabled", v)} />}>
            <div className="grid gap-5 sm:grid-cols-2">{area("payments.cod.instructions", "Instructions", 2)}</div>
          </Panel>
          {wallet("bkash", "bKash")}
          {wallet("nagad", "Nagad")}
          {wallet("rocket", "Rocket")}
          <Panel title="Bank Transfer" actions={<Toggle checked={s.payments.bank.enabled} onChange={(v) => up("payments.bank.enabled", v)} />}>
            <div className="grid gap-5 sm:grid-cols-2">{area("payments.bank.details", "Bank Details (account name, number, bank, branch, routing)", 4)}</div>
          </Panel>
        </div>
      )}

      {tab === "seo" && (
        <div className="space-y-6">
          <Panel title="Orders & Notifications">
            <div className="grid gap-5 sm:grid-cols-3">
              {text("orders.prefix", "Order number prefix", { hint: `1–5 letters — orders look like ${(s.orders.prefix || "OR").toUpperCase()}10001` })}
              {text("orders.notifyEmail", "New-order alert email", { type: "email", hint: "Empty = no alert emails" })}
              {text("orders.timezone", "Timezone", { hint: "Used for daily/monthly reports, e.g. Asia/Dhaka" })}
            </div>
          </Panel>
          <Panel title="Invoice">
            <div className="grid gap-5 sm:grid-cols-2">{area("invoice.footerNote", "Invoice Footer Note", 3, "Appears at the bottom of every invoice and invoice email.")}</div>
          </Panel>
          <Panel title="Search Engine (SEO)">
            <div className="grid gap-5 sm:grid-cols-2">
              {text("seo.title", "Homepage Title", { className: "sm:col-span-2" })}
              {area("seo.description", "Meta Description", 3)}
            </div>
          </Panel>
        </div>
      )}

      {tab === "account" && <PasswordPanel />}
    </div>
  );
}

function PasswordPanel() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) return toast.error("Passwords don't match");
    setSaving(true);
    try {
      await api("/api/admin/account/password", { method: "POST", body: { currentPassword: form.currentPassword, newPassword: form.newPassword } });
      toast.success("Password changed");
      setForm({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Panel title="Change Password" className="max-w-lg">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Current Password"><input type="password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} className="input" autoComplete="current-password" required /></Field>
        <Field label="New Password" hint="At least 8 characters"><input type="password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} className="input" autoComplete="new-password" required minLength={8} /></Field>
        <Field label="Confirm New Password"><input type="password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} className="input" autoComplete="new-password" required /></Field>
        <button disabled={saving} className="btn-primary">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Update Password</button>
      </form>
    </Panel>
  );
}
