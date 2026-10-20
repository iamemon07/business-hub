/**
 * One-time platform setup: super admin account, platform settings and starter plans.
 * Safe to re-run — existing records are left untouched.
 *
 *   npm run seed
 */
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { runAsPlatform } from "../src/lib/tenant-context";
import { Admin } from "../src/models/Admin";
import { Banner } from "../src/models/Banner";
import { Category } from "../src/models/Category";
import { Counter } from "../src/models/Counter";
import { Coupon } from "../src/models/Coupon";
import { Expense, Investment } from "../src/models/Finance";
import { Order } from "../src/models/Order";
import { Page } from "../src/models/Page";
import { Product } from "../src/models/Product";
import { Settings } from "../src/models/Settings";
import { Lead, Plan, PlatformAdmin, PlatformSettings, Tenant, TenantPayment } from "../src/models/platform";

const PLANS = [
  {
    name: "Starter",
    key: "starter",
    description: "Everything you need to start selling online.",
    priceMonthly: 999,
    priceYearly: 9990,
    limits: { products: 100, staff: 1, customDomain: false },
    features: ["Storefront + admin panel", "COD, bKash & Nagad", "Invoices & order tracking"],
    sortOrder: 1,
  },
  {
    name: "Growth",
    key: "growth",
    description: "For growing brands that want their own domain.",
    priceMonthly: 1999,
    priceYearly: 19990,
    limits: { products: 1000, staff: 3, customDomain: true },
    features: ["Everything in Starter", "Profit & ROI reports", "Priority support"],
    sortOrder: 2,
  },
  {
    name: "Pro",
    key: "pro",
    description: "Unlimited everything for established businesses.",
    priceMonthly: 3999,
    priceYearly: 39990,
    limits: { products: 0, staff: 0, customDomain: true },
    features: ["Everything in Growth", "Unlimited products & team", "Setup & data migration help"],
    sortOrder: 3,
  },
];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes("<db_username>")) throw new Error("Set MONGODB_URI in .env.local before seeding.");
  await mongoose.connect(uri);
  console.log(`✓ Connected to MongoDB (${mongoose.connection.name})`);

  await runAsPlatform(async () => {
    // Build all indexes (incl. the per-business unique ones) before any data goes in.
    for (const m of [Tenant, Plan, PlatformAdmin, TenantPayment, Lead, PlatformSettings, Admin, Banner, Category, Counter, Coupon, Expense, Investment, Order, Page, Product, Settings]) {
      await (m as typeof Tenant).syncIndexes();
    }
    console.log("✓ Indexes ready");

    if (!(await PlatformSettings.exists({ key: "platform" }))) {
      await PlatformSettings.create({
        key: "platform",
        name: process.env.PLATFORM_NAME || "Business Hub",
        supportEmail: process.env.SUPERADMIN_EMAIL || "",
      });
      console.log("✓ Platform settings created");
    }

    const email = (process.env.SUPERADMIN_EMAIL || "").toLowerCase();
    const password = process.env.SUPERADMIN_PASSWORD || "";
    if (!email || password.length < 8) {
      console.log("• SUPERADMIN_EMAIL / SUPERADMIN_PASSWORD (min 8 chars) not set — skipping super admin");
    } else if (!(await PlatformAdmin.exists({ email }))) {
      await PlatformAdmin.create({ name: process.env.SUPERADMIN_NAME || "Super Admin", email, passwordHash: await bcrypt.hash(password, 12) });
      console.log(`✓ Super admin created: ${email}`);
    } else {
      console.log(`• Super admin ${email} already exists`);
    }

    for (const p of PLANS) {
      const res = await Plan.updateOne({ key: p.key }, { $setOnInsert: p }, { upsert: true });
      if (res.upsertedCount) console.log(`✓ Plan: ${p.name}`);
    }
  });

  console.log("\nDone. Open the console at http://<PLATFORM_DOMAIN>/console");
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("✗ Seed failed:", err.message);
  await mongoose.disconnect();
  process.exit(1);
});
