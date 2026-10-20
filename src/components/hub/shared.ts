/** Badge tones for a business's subscription state (see services/subscription.ts). */
export const STATE_TONES = {
  active: "green",
  trial: "blue",
  due_soon: "amber",
  overdue: "red",
  trial_expired: "red",
  suspended: "red",
  cancelled: "neutral",
} as const;

export const STATUS_OPTIONS = [
  { value: "trial", label: "Trial" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended (store offline)" },
  { value: "cancelled", label: "Cancelled" },
] as const;
