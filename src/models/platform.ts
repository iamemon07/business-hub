/**
 * Platform-level collections (NOT tenant-scoped). Only the super admin console and the
 * host → business resolver touch these.
 */
import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

export const TENANT_STATUSES = ["trial", "active", "suspended", "cancelled"] as const;
export type TenantStatus = (typeof TENANT_STATUSES)[number];

/* ───────────── Business (tenant) ───────────── */
const TenantSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    /** Subdomain: <slug>.<PLATFORM_DOMAIN>. Lowercase letters, digits and dashes. */
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    /** Extra hostnames pointing at this business, e.g. "shop.example.com". */
    customDomains: { type: [String], default: [] },
    template: { type: String, default: "general" },
    status: { type: String, enum: TENANT_STATUSES, default: "trial", index: true },
    plan: { type: Schema.Types.ObjectId, ref: "Plan" },
    billingCycle: { type: String, enum: ["monthly", "yearly"], default: "monthly" },
    /** Overrides the plan price for this business (0 = use plan price). */
    customPrice: { type: Number, default: 0 },
    trialEndsAt: Date,
    paidUntil: Date,
    owner: {
      name: { type: String, default: "" },
      email: { type: String, default: "", lowercase: true, trim: true },
      phone: { type: String, default: "" },
    },
    notes: { type: String, default: "" },
    /** List on the platform landing page as a customer showcase. */
    showcase: { type: Boolean, default: false },
  },
  { timestamps: true },
);
TenantSchema.index({ customDomains: 1 }, { unique: true, partialFilterExpression: { "customDomains.0": { $exists: true } } });

export type TenantDoc = InferSchemaType<typeof TenantSchema>;
export const Tenant = (models.Tenant as Model<TenantDoc>) || model("Tenant", TenantSchema);

/* ───────────── Subscription plan ───────────── */
const PlanSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    key: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: "" },
    priceMonthly: { type: Number, default: 0, min: 0 },
    priceYearly: { type: Number, default: 0, min: 0 },
    limits: {
      /** 0 = unlimited */
      products: { type: Number, default: 0, min: 0 },
      staff: { type: Number, default: 0, min: 0 },
      customDomain: { type: Boolean, default: false },
    },
    features: { type: [String], default: [] },
    /** Shown on the public pricing section. */
    public: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);
export type PlanDoc = InferSchemaType<typeof PlanSchema>;
export const Plan = (models.Plan as Model<PlanDoc>) || model("Plan", PlanSchema);

/* ───────────── Super admin users ───────────── */
const PlatformAdminSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    active: { type: Boolean, default: true },
    lastLoginAt: Date,
  },
  { timestamps: true },
);
export type PlatformAdminDoc = InferSchemaType<typeof PlatformAdminSchema>;
export const PlatformAdmin = (models.PlatformAdmin as Model<PlatformAdminDoc>) || model("PlatformAdmin", PlatformAdminSchema);

/* ───────────── Subscription payments received from businesses ───────────── */
const TenantPaymentSchema = new Schema(
  {
    tenant: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    date: { type: Date, default: Date.now, index: true },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, default: "bkash" },
    reference: { type: String, default: "" },
    /** The paid period; `periodTo` becomes the business's new `paidUntil`. */
    periodFrom: Date,
    periodTo: Date,
    note: { type: String, default: "" },
    recordedBy: { type: String, default: "" },
  },
  { timestamps: true },
);
export type TenantPaymentDoc = InferSchemaType<typeof TenantPaymentSchema>;
export const TenantPayment = (models.TenantPayment as Model<TenantPaymentDoc>) || model("TenantPayment", TenantPaymentSchema);

/* ───────────── Leads: "start my store" requests from the landing page ───────────── */
export const LEAD_STATUSES = ["new", "contacted", "converted", "archived"] as const;
const LeadSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    businessName: { type: String, default: "", trim: true },
    email: { type: String, default: "", lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    template: { type: String, default: "" },
    plan: { type: String, default: "" },
    message: { type: String, default: "" },
    status: { type: String, enum: LEAD_STATUSES, default: "new", index: true },
    tenant: { type: Schema.Types.ObjectId, ref: "Tenant" },
  },
  { timestamps: true },
);
export type LeadDoc = InferSchemaType<typeof LeadSchema>;
export const Lead = (models.Lead as Model<LeadDoc>) || model("Lead", LeadSchema);

/* ───────────── Platform settings (singleton) ───────────── */
const PlatformSettingsSchema = new Schema(
  {
    key: { type: String, default: "platform", unique: true },
    name: { type: String, default: "Business Hub" },
    tagline: { type: String, default: "Launch your online store in minutes" },
    currencySymbol: { type: String, default: "৳" },
    supportEmail: { type: String, default: "" },
    supportPhone: { type: String, default: "" },
    whatsapp: { type: String, default: "" },
    hero: {
      title: { type: String, default: "Your own online store — ready today" },
      subtitle: {
        type: String,
        default:
          "Storefront, orders, inventory, coupons, invoices and profit reports in one place. Pick your niche, add your products and start selling — no developer needed.",
      },
    },
    /** Show the "request a store" form on the landing page. */
    leadsEnabled: { type: Boolean, default: true },
    trialDays: { type: Number, default: 14, min: 0, max: 365 },
  },
  { timestamps: true, minimize: false },
);
export type PlatformSettingsDoc = InferSchemaType<typeof PlatformSettingsSchema>;
export const PlatformSettings =
  (models.PlatformSettings as Model<PlatformSettingsDoc>) || model("PlatformSettings", PlatformSettingsSchema);
