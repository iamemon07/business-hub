# Business Hub — multi-business e-commerce platform

One app that runs **many online stores**. From the super admin console you create a new business in a minute: it gets its own storefront, admin panel, owner login, brand colors and niche-specific setup. You can also sell the platform to other small businesses and track their subscriptions.

**Stack:** Next.js 15 (App Router, TypeScript) · MongoDB / Mongoose · Tailwind CSS v4 · Zod · JWT (jose) · Nodemailer · Cloudinary (optional) · Recharts

---

## 1. How it fits together

| Address | What it is |
|---|---|
| `yourhub.com` | Public landing page (features, niches, pricing, "start your store" form) |
| `yourhub.com/console` | **Super admin console**: all businesses, plans, payments, leads |
| `sunrise.yourhub.com` | A business's **storefront** |
| `sunrise.yourhub.com/admin` | That business's **admin panel**: orders, products, P&L… |
| `shop.example.com` | Optional custom domain for a business |

- **One database, isolated data.** Every store record carries a `tenant` id. A Mongoose plugin (`src/models/plugins/tenant.ts`) adds the filter to *every* query automatically. Any query that runs without a business context throws an error, so it can never return another store's data.
- **Generic by design.** Each business's settings hold its colors, font, text logo, the label for its variants (Size / Option / Storage / Weight), its spec fields (Material, Fabric, Warranty…), its shop filter, nouns ("Bag" vs "Cart"), image shape, order-number prefix and more. **Templates** (`src/templates`) only pre-fill these values: Fashion, Home Decor, Electronics, Beauty, Grocery, General.

## 2. Setup

```bash
npm install
cp .env.example .env.local   # then fill it in
npm run seed                 # super admin + platform settings + Starter/Growth/Pro plans
npm run dev
```

| Variable | What to put |
|---|---|
| `MONGODB_URI` | Atlas connection string. Database name `businesshub` (before the `?`). |
| `AUTH_SECRET` | Long random string (see the comment in `.env.example`). |
| `PLATFORM_DOMAIN` | `localhost:3000` locally; your real domain in production (e.g. `bizhub.com.bd`). |
| `SUPERADMIN_EMAIL` / `SUPERADMIN_PASSWORD` | Your console login, created by `npm run seed`. |
| `SMTP_*`, `MAIL_FROM` | One mailbox sends for every business, using each store's name as the sender name. |
| `CLOUDINARY_URL` | Optional; enables image upload buttons (files go to `hub/<slug>`). |

**Local addresses.** Browsers resolve `*.localhost` automatically, so no hosts-file edits are needed:
- Platform → http://localhost:3000 · Console → http://localhost:3000/console
- A business with address `sunrise` → http://sunrise.localhost:3000 · its admin → http://sunrise.localhost:3000/admin

> **Testing emails:** use `<anything>@yopmail.com` for owner, customer and alert emails. Mail to made-up domains bounces and can get the sending Gmail blocked.

## 3. Super admin console

| Page | What you can do |
|---|---|
| **Dashboard** | Business counts, MRR, payments collected, sales across all stores, stores needing attention (trial ending, payment overdue), new leads |
| **Businesses** | Search/filter every store with plan, status, product count, 30-day and lifetime sales |
| **New Business** | Name + address (live availability check), niche template, brand colors, owner login (password generator), plan, trial. Ends with copy-ready login details. |
| **Business detail** | **Open Store Admin** (one-click, single-use, 60-second sign-in link), status (trial / active / suspended / cancelled), plan, billing cycle, custom price, trial & paid-until dates, custom domains, owner contact, notes, landing-page showcase, **record payments** (extends paid-until automatically), reset team passwords, delete the business (type its address to confirm) |
| **Plans & Pricing** | Monthly/yearly price, product & team limits (enforced inside each store), custom-domain flag, feature bullets, show/hide on pricing |
| **Leads** | Requests from the landing page form → **Create business** pre-fills the form |
| **Platform Settings** | Platform name, support contact (shown to store owners), landing page text, default trial length, super admins, your password |

**Suspended / cancelled** businesses show a "temporarily unavailable" storefront. Their owners can still log in to see the notice, but every change is blocked. Expired trials and overdue payments are flagged to you and to the owner, but nothing switches off automatically: you decide.

## 4. Inside each store (owner/staff)

The full store toolkit (dashboard, orders, products, categories, coupons, banners, pages, P&L/ROI, expenses, investments, team), plus:
- **Site Settings → Look & Feel:** brand colors (live preview), Elegant/Modern typography, text logo, accent lines
- **Site Settings → Catalog Setup:** variant label & presets, spec fields, shop filter, nouns, image shape, default care text
- **Site Settings → Orders:** order-number prefix, new-order alert email, timezone
- **Subscription:** plan, status, renewal date, usage vs limits, payment history, how to renew

A business with no uploaded logo or banner gets generated ones in its brand colors (`/api/brand/<id>/logo.svg`).

## 5. Importing an existing single-store database (optional)

If a customer already runs the older single-store version of this app, `import:store` copies that database into the hub as a new business. Products, orders, customers, coupons, finance, pages and admin logins (with their existing passwords) all come across. **The source database is only read, never changed.**

```bash
npm run import:store -- --from <sourceDbName> --slug <address> --template <fashion|home-decor|electronics|beauty|grocery|general> [--plan growth] [--status active]
```

## 6. Deploying (Vercel recommended)

1. Push to GitHub and import the repo on Vercel. Add all `.env.local` variables, with `PLATFORM_DOMAIN=yourhub.com`.
2. Add domains in Vercel: `yourhub.com` **and** the wildcard `*.yourhub.com`. Wildcards require Vercel's nameservers for the domain, which it walks you through.
3. In MongoDB Atlas → Network Access, allow `0.0.0.0/0`.
4. **Custom domain for a business:** the owner adds a `CNAME` record from `shop.theirdomain.com` → `yourhub.com`. You add the domain in Vercel, then in the console under that business.

## 7. Engineering notes

- **Isolation layers:** host → business resolution (cached, `lib/tenant.ts`); store sessions bound to a business id (a cookie copied to another store is rejected); separate cookie + JWT audience for super admins; Mongoose tenant plugin on every store model; per-business unique indexes and cache tags.
- **Writing code:** inside API routes use `publicRoute` / `adminRoute` (scoped automatically) or `platformRoute` (super admin, unscoped). In scripts/console code, wrap business work in `runWithTenant(id, () => …)`. It awaits inside the scope, so lazy Mongoose queries can't escape it.
- **New niche template:** add an entry to `TEMPLATES` in `src/templates/index.ts`. It appears in the console, the landing page and the lead form automatically.
- The login/checkout rate limiter is in-memory per server instance; swap `src/lib/rate-limit.ts` for Upstash Redis at scale.

```
src/
  app/hub/            platform: landing page + /console (served on the root domain via middleware rewrite)
  app/(store)/        storefront          app/admin/       store admin
  app/api/hub/        console APIs        app/api/         store APIs (+ /api/brand generated artwork)
  models/platform.ts  Tenant, Plan, PlatformAdmin, TenantPayment, Lead, PlatformSettings
  models/plugins/     tenant isolation    templates/       niche presets
  services/           provision, platform-stats, subscription, orders, reports, catalog…
scripts/              seed-platform.ts, import-store.ts
```

Scripts: `npm run dev` · `build` · `start` · `lint` · `typecheck` · `seed` · `import:store`
