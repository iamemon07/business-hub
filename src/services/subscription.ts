import type { TenantInfo } from "@/types";

const DAY = 24 * 60 * 60 * 1000;

/** Derived billing state shown to store owners and the super admin. */
export function subscriptionState(t: Pick<TenantInfo, "status" | "trialEndsAt" | "paidUntil">, now = new Date()) {
  const trialEnds = t.trialEndsAt ? new Date(t.trialEndsAt) : null;
  const paidUntil = t.paidUntil ? new Date(t.paidUntil) : null;
  const daysLeft = (d: Date | null) => (d ? Math.ceil((d.getTime() - now.getTime()) / DAY) : null);

  if (t.status === "suspended") return { key: "suspended" as const, label: "Suspended", days: null };
  if (t.status === "cancelled") return { key: "cancelled" as const, label: "Cancelled", days: null };
  if (t.status === "trial") {
    const d = daysLeft(trialEnds);
    if (d !== null && d < 0) return { key: "trial_expired" as const, label: "Trial ended", days: d };
    return { key: "trial" as const, label: d !== null ? `Trial · ${d} day${d === 1 ? "" : "s"} left` : "Trial", days: d };
  }
  const d = daysLeft(paidUntil);
  if (d !== null && d < 0) return { key: "overdue" as const, label: "Payment overdue", days: d };
  if (d !== null && d <= 7) return { key: "due_soon" as const, label: `Renews in ${d} day${d === 1 ? "" : "s"}`, days: d };
  return { key: "active" as const, label: "Active", days: d };
}

/** Banner text for the store admin, or null when nothing needs attention. */
export function subscriptionNotice(t: TenantInfo): { tone: "amber" | "red"; text: string } | null {
  const s = subscriptionState(t);
  switch (s.key) {
    case "suspended":
    case "cancelled":
      return { tone: "red", text: "This store is suspended — the website is offline and changes are disabled. Please contact the platform to reactivate." };
    case "trial_expired":
      return { tone: "red", text: "Your free trial has ended. Please choose a plan to keep your store online." };
    case "overdue":
      return { tone: "red", text: "Your subscription payment is overdue. Please renew to avoid interruption." };
    case "trial":
      return s.days !== null && s.days <= 5 ? { tone: "amber", text: `Your free trial ends in ${s.days} day${s.days === 1 ? "" : "s"}.` } : null;
    case "due_soon":
      return { tone: "amber", text: `Your subscription renews in ${s.days} day${s.days === 1 ? "" : "s"}.` };
    default:
      return null;
  }
}
