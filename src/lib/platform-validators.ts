import { z } from "zod";
import { TENANT_STATUSES, LEAD_STATUSES } from "@/models/platform";

const str = (max: number) => z.string().trim().max(max);
const objectId = z.string().regex(/^[a-f0-9]{24}$/i, "Invalid id");
const hex = z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Use a 6-digit hex color");
const domain = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^(?!-)[a-z0-9-]+(\.[a-z0-9-]+)+$/, "Enter a domain like shop.example.com (no https://)");

export const createBusinessSchema = z.object({
  name: str(80).min(2, "Business name is required"),
  slug: str(40).toLowerCase().min(2, "Store address is required"),
  template: str(40).min(1),
  ownerName: str(80).min(2, "Owner name is required"),
  ownerEmail: z.string().trim().toLowerCase().email("Enter a valid owner email"),
  ownerPhone: str(30).optional().default(""),
  ownerPassword: z.string().min(8, "Owner password must be at least 8 characters").max(100),
  planId: objectId.or(z.literal("")).optional().default(""),
  status: z.enum(TENANT_STATUSES).default("trial"),
  trialDays: z.coerce.number().int().min(0).max(365).optional(),
  currencySymbol: str(5).optional(),
  theme: z.object({ primary: hex, accent: hex, background: hex }).partial().optional(),
  leadId: objectId.optional(),
});

export const updateBusinessSchema = z.object({
  name: str(80).min(2),
  status: z.enum(TENANT_STATUSES),
  planId: objectId.or(z.literal("")),
  billingCycle: z.enum(["monthly", "yearly"]),
  customPrice: z.coerce.number().min(0).max(10_000_000),
  trialEndsAt: z.string().trim().or(z.literal("")),
  paidUntil: z.string().trim().or(z.literal("")),
  customDomains: z.array(domain).max(5),
  owner: z.object({ name: str(80), email: z.string().trim().toLowerCase().email().or(z.literal("")), phone: str(30) }),
  notes: str(5000),
  showcase: z.boolean(),
});

export const paymentSchema = z.object({
  date: z.string().trim().min(1),
  amount: z.coerce.number().min(0).max(100_000_000),
  method: str(40).min(1),
  reference: str(120).optional().default(""),
  months: z.coerce.number().int().min(0).max(36).default(1),
  note: str(500).optional().default(""),
});

export const planSchema = z.object({
  name: str(60).min(1),
  key: str(40).toLowerCase().regex(/^[a-z0-9-]+$/, "Key: lowercase letters, numbers and dashes"),
  description: str(300).optional().default(""),
  priceMonthly: z.coerce.number().min(0).max(10_000_000),
  priceYearly: z.coerce.number().min(0).max(100_000_000),
  limits: z.object({
    products: z.coerce.number().int().min(0).max(1_000_000),
    staff: z.coerce.number().int().min(0).max(1000),
    customDomain: z.boolean(),
  }),
  features: z.array(str(120).min(1)).max(20).default([]),
  public: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
  active: z.boolean().default(true),
});

export const leadSchema = z.object({
  name: str(80).min(2, "Please enter your name"),
  businessName: str(100).optional().default(""),
  email: z.string().trim().toLowerCase().email().or(z.literal("")).optional().default(""),
  phone: str(30).min(6, "Please enter a phone number"),
  template: str(40).optional().default(""),
  plan: str(60).optional().default(""),
  message: str(2000).optional().default(""),
  // Honeypot: real people leave this empty.
  website: z.string().max(0).optional().default(""),
});

export const leadUpdateSchema = z.object({ status: z.enum(LEAD_STATUSES) });

export const platformSettingsSchema = z.object({
  name: str(80).min(1),
  tagline: str(160),
  currencySymbol: str(5).min(1),
  supportEmail: z.string().trim().email().or(z.literal("")),
  supportPhone: str(30),
  whatsapp: str(30),
  hero: z.object({ title: str(160), subtitle: str(500) }),
  leadsEnabled: z.boolean(),
  trialDays: z.coerce.number().int().min(0).max(365),
});

export const platformAdminSchema = z.object({
  name: str(80).min(2),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
});
