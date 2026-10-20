import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { tenantPlugin } from "./plugins/tenant";

/**
 * Expense categories. `inventory` is stock purchase — it's tracked for cash flow
 * but excluded from operating expenses in P&L because product cost is already
 * counted as COGS (via each product's cost price) when an item sells.
 */
export const EXPENSE_CATEGORIES = [
  { value: "inventory", label: "Inventory / Stock Purchase" },
  { value: "marketing", label: "Marketing & Ads" },
  { value: "packaging", label: "Packaging" },
  { value: "delivery", label: "Delivery / Courier" },
  { value: "salary", label: "Salary & Wages" },
  { value: "rent", label: "Rent" },
  { value: "utilities", label: "Utilities & Internet" },
  { value: "software", label: "Software & Hosting" },
  { value: "photography", label: "Photography & Content" },
  { value: "transaction", label: "Payment / Bank Fees" },
  { value: "equipment", label: "Equipment" },
  { value: "other", label: "Other" },
] as const;

const ExpenseSchema = new Schema(
  {
    date: { type: Date, required: true, index: true },
    category: { type: String, enum: EXPENSE_CATEGORIES.map((c) => c.value), required: true },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    note: { type: String, default: "" },
  },
  { timestamps: true },
);

const InvestmentSchema = new Schema(
  {
    date: { type: Date, required: true, index: true },
    source: { type: String, required: true, trim: true }, // e.g. "Owner capital", "Partner – Rahim"
    amount: { type: Number, required: true },
    /** capital = money put in, withdrawal = money taken out by owners */
    type: { type: String, enum: ["capital", "withdrawal"], default: "capital" },
    note: { type: String, default: "" },
  },
  { timestamps: true },
);

ExpenseSchema.plugin(tenantPlugin);
InvestmentSchema.plugin(tenantPlugin);

export type ExpenseDoc = InferSchemaType<typeof ExpenseSchema>;
export type InvestmentDoc = InferSchemaType<typeof InvestmentSchema>;
export const Expense = (models.Expense as Model<ExpenseDoc>) || model("Expense", ExpenseSchema);
export const Investment = (models.Investment as Model<InvestmentDoc>) || model("Investment", InvestmentSchema);
