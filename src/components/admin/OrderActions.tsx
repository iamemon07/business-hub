"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Send, Trash2 } from "lucide-react";
import { api } from "@/lib/client-api";
import type { OrderDTO } from "@/types";
import { Field, Panel } from "./ui";

const STATUSES: OrderDTO["status"][] = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"];
const PAYMENTS: OrderDTO["paymentStatus"][] = ["pending", "paid", "failed", "refunded"];

export function OrderActions({ order }: { order: OrderDTO }) {
  const router = useRouter();
  const [status, setStatus] = useState(order.status);
  const [statusNote, setStatusNote] = useState("");
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus);
  const [courierCost, setCourierCost] = useState<number | "">(order.courierCost || "");
  const [trackingCode, setTrackingCode] = useState(order.trackingCode);
  const [adminNote, setAdminNote] = useState(order.adminNote);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  const save = async () => {
    if ((status === "cancelled" || status === "returned") && status !== order.status && !confirm(`Mark as ${status}? Stock will be returned to inventory.`)) return;
    setSaving(true);
    try {
      await api(`/api/admin/orders/${order._id}`, {
        method: "PATCH",
        body: {
          ...(status !== order.status ? { status, statusNote } : {}),
          ...(paymentStatus !== order.paymentStatus ? { paymentStatus } : {}),
          courierCost: Number(courierCost) || 0,
          trackingCode,
          adminNote,
        },
      });
      toast.success("Order updated");
      setStatusNote("");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const resend = async () => {
    setSending(true);
    try {
      await api(`/api/admin/orders/${order._id}/invoice`, { method: "POST" });
      toast.success("Invoice emailed to customer");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  const remove = async () => {
    if (!confirm("Permanently delete this order? Stock will be restored. Prefer 'cancelled' to keep records.")) return;
    try {
      await api(`/api/admin/orders/${order._id}`, { method: "DELETE" });
      toast.success("Order deleted");
      router.push("/admin/orders");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <>
      <Panel title="Update Order">
        <div className="space-y-4">
          <Field label="Order Status">
            <select value={status} onChange={(e) => setStatus(e.target.value as OrderDTO["status"])} className="input capitalize">
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          {status !== order.status && (
            <Field label="Note for timeline (optional)">
              <input value={statusNote} onChange={(e) => setStatusNote(e.target.value)} className="input" placeholder="e.g. Handed to Pathao" />
            </Field>
          )}
          <Field label="Payment Status" hint={order.paymentMethod === "cod" ? "COD orders auto-mark paid when delivered." : "Verify the TrxID in your wallet app, then mark paid."}>
            <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as OrderDTO["paymentStatus"])} className="input capitalize">
              {PAYMENTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Courier Tracking Code" hint="Shown to the customer on their order page.">
            <input value={trackingCode} onChange={(e) => setTrackingCode(e.target.value)} className="input" />
          </Field>
          <Field label="Actual Courier Cost" hint="What you paid the courier — used in P&L.">
            <input type="number" min={0} value={courierCost} onChange={(e) => setCourierCost(e.target.value === "" ? "" : Number(e.target.value))} className="input" />
          </Field>
          <Field label="Internal Note">
            <textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} rows={3} className="input" placeholder="Only visible to admins" />
          </Field>
          <button onClick={save} disabled={saving} className="btn-primary w-full">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save Changes
          </button>
        </div>
      </Panel>

      <Panel title="Invoice">
        <p className="mb-4 text-sm text-muted">
          {order.customer.email ? `Email the invoice to ${order.customer.email}.` : "Customer didn't provide an email — print or share the invoice instead."}
        </p>
        <button onClick={resend} disabled={sending || !order.customer.email} className="btn-outline w-full">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} {order.invoiceSentAt ? "Resend Invoice" : "Send Invoice"}
        </button>
      </Panel>

      <button onClick={remove} className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs uppercase tracking-wider text-muted hover:text-red-600">
        <Trash2 className="h-3.5 w-3.5" /> Delete order
      </button>
    </>
  );
}
