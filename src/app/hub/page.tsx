import Link from "next/link";
import {
  BarChart3,
  BadgePercent,
  Check,
  FileText,
  Globe,
  Package,
  Palette,
  ShoppingCart,
  Smartphone,
  Wallet,
} from "lucide-react";
import { LeadForm } from "@/components/hub/LeadForm";
import { formatPrice } from "@/lib/utils";
import { getLandingData } from "@/services/platform";
import { templateSummaries } from "@/templates";

const FEATURES = [
  { icon: ShoppingCart, title: "Beautiful storefront", text: "Fast, mobile-first shop with cart, checkout and order tracking." },
  { icon: Package, title: "Orders & inventory", text: "Order pipeline, stock per variant, low-stock alerts and courier tracking." },
  { icon: FileText, title: "Invoices", text: "Printable invoices and automatic invoice emails for every order." },
  { icon: Wallet, title: "Local payments", text: "Cash on delivery, bKash, Nagad, Rocket and bank transfer." },
  { icon: BadgePercent, title: "Coupons & sales", text: "Percent or fixed coupons, product discounts and promo banners." },
  { icon: BarChart3, title: "Profit & ROI reports", text: "Real profit after cost, delivery and expenses — not just sales." },
  { icon: Palette, title: "Your brand", text: "Your colors, logo, fonts and wording — made for your niche." },
  { icon: Globe, title: "Your own domain", text: "Start on a free address and connect your own domain anytime." },
  { icon: Smartphone, title: "Manage from phone", text: "Run your whole business from your phone's browser." },
];

export default async function LandingPage() {
  const { settings, plans, showcase } = await getLandingData();
  const templates = templateSummaries();
  const cur = settings.currencySymbol;

  return (
    <div className="bg-cream text-cocoa">
      <header className="sticky top-0 z-40 border-b border-line bg-cream/90 backdrop-blur">
        <div className="container-x flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose font-semibold text-white">{settings.name.charAt(0)}</span>
            <span className="text-lg font-semibold">{settings.name}</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-cocoa-light md:flex">
            <a href="#features" className="hover:text-rose">Features</a>
            <a href="#niches" className="hover:text-rose">Niches</a>
            {plans.length > 0 && <a href="#pricing" className="hover:text-rose">Pricing</a>}
          </nav>
          {settings.leadsEnabled && <a href="#start" className="btn-primary px-5 py-2.5">Start your store</a>}
        </div>
      </header>

      <section className="container-x py-20 text-center sm:py-28">
        <p className="eyebrow mb-4">{settings.tagline}</p>
        <h1 className="mx-auto max-w-3xl text-4xl font-semibold leading-tight sm:text-6xl">{settings.hero.title}</h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-cocoa-light">{settings.hero.subtitle}</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {settings.leadsEnabled && <a href="#start" className="btn-primary px-8 py-4">Get started</a>}
          <a href="#features" className="btn-outline px-8 py-4">See what&apos;s included</a>
        </div>
      </section>

      <section id="features" className="border-y border-line bg-ivory py-20">
        <div className="container-x">
          <h2 className="text-center text-3xl font-semibold sm:text-4xl">Everything to run your online business</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-line bg-white p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blush-100 text-rose"><Icon className="h-5 w-5" /></div>
                <p className="mt-4 font-semibold">{title}</p>
                <p className="mt-1 text-sm text-muted">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="niches" className="container-x py-20">
        <h2 className="text-center text-3xl font-semibold sm:text-4xl">Made for your niche</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-cocoa-light">Start from a template designed for what you sell — then make it completely yours.</p>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <div key={t.key} className="overflow-hidden rounded-2xl border border-line bg-white">
              <div className="flex h-24 items-end gap-2 p-5" style={{ background: t.theme.background }}>
                <span className="h-8 w-20 rounded-full" style={{ background: t.theme.primary }} />
                <span className="h-8 w-8 rounded-full" style={{ background: t.theme.accent }} />
              </div>
              <div className="p-5">
                <p className="font-semibold">{t.name}</p>
                <p className="mt-1 text-sm text-muted">{t.description}</p>
                <p className="mt-2 text-xs text-cocoa-light">{t.examples}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {plans.length > 0 && (
        <section id="pricing" className="border-y border-line bg-ivory py-20">
          <div className="container-x">
            <h2 className="text-center text-3xl font-semibold sm:text-4xl">Simple pricing</h2>
            <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-3">
              {plans.map((p, i) => (
                <div key={p._id} className={i === 1 ? "rounded-3xl border-2 border-rose bg-white p-7 shadow-xl shadow-rose/10" : "rounded-3xl border border-line bg-white p-7"}>
                  <p className="text-lg font-semibold">{p.name}</p>
                  {p.description && <p className="mt-1 text-sm text-muted">{p.description}</p>}
                  <p className="mt-5 text-4xl font-semibold">{formatPrice(p.priceMonthly, cur)}<span className="text-base font-normal text-muted">/mo</span></p>
                  {p.priceYearly > 0 && <p className="text-xs text-muted">or {formatPrice(p.priceYearly, cur)}/year</p>}
                  <ul className="mt-6 space-y-2 text-sm">
                    <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-rose" />{p.limits.products ? `Up to ${p.limits.products} products` : "Unlimited products"}</li>
                    <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-rose" />{p.limits.staff ? `${p.limits.staff} team member${p.limits.staff > 1 ? "s" : ""}` : "Unlimited team members"}</li>
                    {p.limits.customDomain && <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-rose" />Your own domain</li>}
                    {p.features.map((f) => <li key={f} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-rose" />{f}</li>)}
                  </ul>
                  {settings.leadsEnabled && <a href="#start" className={i === 1 ? "btn-primary mt-8 w-full" : "btn-outline mt-8 w-full"}>Choose {p.name}</a>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {showcase.length > 0 && (
        <section className="container-x py-20">
          <h2 className="text-center text-3xl font-semibold sm:text-4xl">Stores running on {settings.name}</h2>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {showcase.map((s) => (
              <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="rounded-full border border-line bg-white px-5 py-2.5 text-sm hover:border-rose hover:text-rose">
                {s.name}
              </a>
            ))}
          </div>
        </section>
      )}

      {settings.leadsEnabled && (
        <section id="start" className="container-x py-20">
          <div className="mx-auto max-w-2xl rounded-3xl border border-line bg-blush-50 p-8 sm:p-10">
            <h2 className="text-center text-3xl font-semibold">Start your store</h2>
            <p className="mt-2 text-center text-sm text-cocoa-light">Tell us a little about your business — we&apos;ll set everything up for you.</p>
            <div className="mt-8">
              <LeadForm templates={templates.map((t) => ({ key: t.key, name: t.name }))} plans={plans.map((p) => p.name)} />
            </div>
          </div>
        </section>
      )}

      <footer className="border-t border-line py-10">
        <div className="container-x flex flex-col items-center justify-between gap-3 text-sm text-muted sm:flex-row">
          <p>© {new Date().getFullYear()} {settings.name}</p>
          <div className="flex gap-5">
            {settings.supportPhone && <a href={`tel:${settings.supportPhone}`} className="hover:text-rose">{settings.supportPhone}</a>}
            {settings.supportEmail && <a href={`mailto:${settings.supportEmail}`} className="hover:text-rose">{settings.supportEmail}</a>}
          </div>
        </div>
      </footer>
    </div>
  );
}
