/** Badge tones per order/payment status. Plain module so Server Components can import it. */
export const STATUS_TONES: Record<string, "neutral" | "green" | "amber" | "red" | "blue" | "rose" | "purple"> = {
  pending: "amber",
  confirmed: "blue",
  processing: "purple",
  shipped: "rose",
  delivered: "green",
  cancelled: "red",
  returned: "neutral",
  paid: "green",
  failed: "red",
  refunded: "neutral",
};
