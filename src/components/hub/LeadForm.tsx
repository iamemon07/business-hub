"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Send } from "lucide-react";

export function LeadForm({ templates, plans }: { templates: { key: string; name: string }[]; plans: string[] }) {
  const [f, setF] = useState({ name: "", businessName: "", phone: "", email: "", template: "", plan: "", message: "", website: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/hub/public/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setDone(true);
    } catch (err) {
      toast.error((err as Error).message || "Could not send your request");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <CheckCircle2 className="h-12 w-12 text-emerald-600" />
        <p className="mt-4 text-xl font-semibold">Thanks! We&apos;ll be in touch shortly.</p>
        <p className="mt-1 text-sm text-muted">We usually reply within a few hours.</p>
      </div>
    );
  }

  const input = "input bg-white";
  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Your name *" className={input} required />
      <input value={f.businessName} onChange={(e) => setF({ ...f, businessName: e.target.value })} placeholder="Business name" className={input} />
      <input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="Phone / WhatsApp *" inputMode="tel" className={input} required />
      <input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="Email" className={input} />
      <select value={f.template} onChange={(e) => setF({ ...f, template: e.target.value })} className={input}>
        <option value="">What do you sell?</option>
        {templates.map((t) => <option key={t.key} value={t.key}>{t.name}</option>)}
      </select>
      <select value={f.plan} onChange={(e) => setF({ ...f, plan: e.target.value })} className={input}>
        <option value="">Plan (optional)</option>
        {plans.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>
      <textarea value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} placeholder="Anything we should know?" rows={3} className={`${input} sm:col-span-2`} />
      {/* Honeypot field — hidden from people, filled by bots. */}
      <input value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <button disabled={busy} className="btn-primary py-4 sm:col-span-2">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Request My Store
      </button>
    </form>
  );
}
