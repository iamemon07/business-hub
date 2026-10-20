import { z } from "zod";

const str = (max = 500) => z.string().trim().max(max);
const optStr = (max = 500) => z.string().trim().max(max).optional().default("");
const money = z.coerce.number().min(0).max(10_000_000);
const bdPhone = z
  .string()
  .trim()
  .transform((s) => s.replace(/[\s-]/g, ""))
  .refine((s) => /^(\+?88)?01[3-9]\d{8}$/.test(s), "Enter a valid Bangladeshi mobile number (01XXXXXXXXX)");

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(200),
});

export const categorySchema = z.object({
  name: str(80).min(1, "Name is required"),
  slug: optStr(100),
  description: optStr(1000),
  image: optStr(1000),
  sortOrder: z.coerce.number().int().default(0),
  showOnHome: z.boolean().default(true),
  active: z.boolean().default(true),
});

export const productSchema = z.object({
  name: str(150).min(1, "Name is required"),
  slug: optStr(160),
  sku: optStr(60),
  shortDescription: optStr(300),
  description: optStr(5000),
  category: z.string().trim().regex(/^[a-f0-9]{24}$/i, "Select a category").or(z.literal("")).optional(),
  images: z.array(z.string().trim().min(1).max(1000)).max(12).default([]),
  price: money,
  discountPercent: z.coerce.number().min(0).max(95).default(0),
  costPrice: money.default(0),
  variants: z
    .array(z.object({ size: str(40).min(1), stock: z.coerce.number().int().min(0).max(100000) }))
    .max(30)
    .default([]),
  colors: z.array(str(40).min(1)).max(30).default([]),
  specs: z.array(z.object({ key: str(40).min(1), value: str(300) })).max(20).default([]),
  care: optStr(1000),
  tags: z.array(str(40).min(1)).max(30).default([]),
  isNewArrival: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  active: z.boolean().default(true),
  seoTitle: optStr(160),
  seoDescription: optStr(320),
});

/** Partial product update for quick toggles in the product table. */
export const productPatchSchema = z
  .object({
    isNewArrival: z.boolean(),
    isBestSeller: z.boolean(),
    isFeatured: z.boolean(),
    active: z.boolean(),
    discountPercent: z.coerce.number().min(0).max(95),
  })
  .partial();

export const couponSchema = z.object({
  code: str(30).min(2).regex(/^[A-Za-z0-9_-]+$/, "Letters, numbers, - and _ only"),
  description: optStr(200),
  type: z.enum(["percent", "fixed"]),
  value: money,
  minOrder: money.default(0),
  maxDiscount: money.default(0),
  usageLimit: z.coerce.number().int().min(0).default(0),
  startsAt: z.coerce.date().optional().nullable(),
  expiresAt: z.coerce.date().optional().nullable(),
  active: z.boolean().default(true),
});

export const bannerSchema = z.object({
  title: optStr(150),
  subtitle: optStr(300),
  image: str(1000).min(1, "Image is required"),
  mobileImage: optStr(1000),
  link: optStr(500),
  ctaText: optStr(40),
  placement: z.enum(["hero", "promo"]).default("hero"),
  showOverlayText: z.boolean().default(false),
  sortOrder: z.coerce.number().int().default(0),
  active: z.boolean().default(true),
});

export const pageSchema = z.object({
  slug: str(80).min(1).regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and - only"),
  title: str(150).min(1),
  content: optStr(50_000),
  showInFooter: z.boolean().default(true),
  active: z.boolean().default(true),
});

export const expenseSchema = z.object({
  date: z.coerce.date(),
  category: z.string().min(1),
  title: str(150).min(1),
  amount: money,
  note: optStr(1000),
});

export const investmentSchema = z.object({
  date: z.coerce.date(),
  source: str(150).min(1),
  amount: money,
  type: z.enum(["capital", "withdrawal"]).default("capital"),
  note: optStr(1000),
});

export const checkoutSchema = z
  .object({
    customer: z.object({
      name: str(100).min(2, "Please enter your full name"),
      phone: bdPhone,
      email: z.string().trim().toLowerCase().email("Enter a valid email").or(z.literal("")).default(""),
    }),
    shipping: z.object({
      address: str(400).min(5, "Please enter your full address"),
      city: str(80).min(2, "City / district is required"),
      area: optStr(80),
      zone: z.enum(["inside", "outside"]),
      note: optStr(500),
    }),
    items: z
      .array(
        z.object({
          productId: z.string().regex(/^[a-f0-9]{24}$/i),
          size: optStr(40),
          color: optStr(40),
          quantity: z.coerce.number().int().min(1).max(20),
        }),
      )
      .min(1, "Your cart is empty")
      .max(50),
    couponCode: optStr(30),
    paymentMethod: z.enum(["cod", "bkash", "nagad", "rocket", "bank"]),
    transactionId: optStr(60),
    senderNumber: optStr(20),
  })
  .superRefine((v, ctx) => {
    if (["bkash", "nagad", "rocket"].includes(v.paymentMethod)) {
      if (!v.transactionId)
        ctx.addIssue({ code: "custom", path: ["transactionId"], message: "Transaction ID is required" });
      if (!v.senderNumber)
        ctx.addIssue({ code: "custom", path: ["senderNumber"], message: "Sender number is required" });
    }
  });

export const orderUpdateSchema = z
  .object({
    status: z.enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"]),
    statusNote: optStr(300),
    paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]),
    courierCost: money,
    trackingCode: optStr(100),
    adminNote: optStr(2000),
  })
  .partial();

export const adminUserSchema = z.object({
  name: str(80).min(2),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, "Password must be at least 8 characters").max(200).optional().or(z.literal("")),
  role: z.enum(["owner", "staff"]).default("staff"),
  active: z.boolean().default(true),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "New password must be at least 8 characters").max(200),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
