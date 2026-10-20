"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Mail, Phone, Store, Trash2 } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/admin/ui";
import { api } from "@/lib/client-api";
import { formatDate } from "@/lib/utils";

type Lead = {
  _id: string;
  name: string;
  businessName: string;
  email: string;
  phone: string;
  template: string;
  plan: string;
  message: string;
  status: "new" | "contacted" | "converted" | "archived";
  tenant?: string;
  createdAt: string;
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const load = useCallback(() => api<Lead[]>("/api/hub/leads").then(setLeads).catch((e) => toast.error(e.message)), []);
  useEffect(() => void load(), [load]);

  const setStatus = async (l: Lead, status: Lead["status"]) => {
    try {
      await api(`/api/hub/leads/${l._id}`, { method: "PUT", body: { status } });
      load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  const remove = async (l: Lead) => {
    if (!confirm(`Delete the request from ${l.name}?`)) return;
    await api(`/api/hub/leads/${l._id}`, { method: "DELETE" }).catch((e) => toast.error(e.message));
    load();
  };

  return (
    <div>
      <PageHeader title="Leads" description="Store requests from your landing page. Turn one into a live business in a click." />
      {!leads ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-rose" /></div>
      ) : leads.length === 0 ? (
        <EmptyState title="No requests yet" text="When someone fills in the “Start your store” form on your landing page, it shows up here." />
      ) : (
        <div className="space-y-3">
          {leads.map((l) => (
            <div key={l._id} className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5 sm:flex-row sm:items-start">
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {l.businessName || l.name} {l.businessName && <span className="font-normal text-muted">· {l.name}</span>}
                </p>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                  <a href={`tel:${l.phone}`} className="inline-flex items-center gap-1 hover:text-rose"><Phone className="h-3 w-3" />{l.phone}</a>
                  {l.email && <a href={`mailto:${l.email}`} className="inline-flex items-center gap-1 hover:text-rose"><Mail className="h-3 w-3" />{l.email}</a>}
                  {l.template && <span>Niche: {l.template}</span>}
                  {l.plan && <span>Plan: {l.plan}</span>}
                  <span>{formatDate(l.createdAt)}</span>
                </div>
                {l.message && <p className="mt-2 whitespace-pre-line text-sm text-cocoa-light">{l.message}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <select value={l.status} onChange={(e) => setStatus(l, e.target.value as Lead["status"])} className="rounded-full border border-line bg-white px-3 py-1.5 text-xs">
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="converted">Converted</option>
                  <option value="archived">Archived</option>
                </select>
                {l.tenant ? (
                  <Link href={`/console/businesses/${l.tenant}`} className="btn-soft px-4 py-2">View store</Link>
                ) : (
                  <Link href={`/console/businesses/new?lead=${l._id}`} className="btn-primary px-4 py-2"><Store className="h-3.5 w-3.5" /> Create business</Link>
                )}
                <button onClick={() => remove(l)} className="rounded-full p-2 text-muted hover:bg-red-50 hover:text-red-600" aria-label="Delete lead"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
