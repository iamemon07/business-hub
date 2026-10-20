import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { wordmarkOf } from "@/lib/utils";
import type { SettingsDTO } from "@/types";
import { FacebookIcon, InstagramIcon, TiktokIcon, WhatsappIcon, YoutubeIcon } from "./Icons";

type Props = {
  settings: SettingsDTO;
  categories: { name: string; slug: string }[];
  pages: { slug: string; title: string }[];
};

export function Footer({ settings, categories, pages }: Props) {
  const socials = [
    { href: settings.social.facebook, label: "Facebook", Icon: FacebookIcon },
    { href: settings.social.instagram, label: "Instagram", Icon: InstagramIcon },
    { href: settings.social.tiktok, label: "TikTok", Icon: TiktokIcon },
    { href: settings.social.youtube, label: "YouTube", Icon: YoutubeIcon },
    { href: settings.whatsapp ? `https://wa.me/${settings.whatsapp.replace(/\D/g, "")}` : "", label: "WhatsApp", Icon: WhatsappIcon },
  ].filter((s) => s.href);
  const mark = wordmarkOf(settings.storeName, settings.wordmark);

  return (
    <footer className="mt-24 border-t border-line bg-blush-50 print:hidden">
      <div className="container-x grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <Link href="/" className="flex items-center gap-3">
            <Image src={settings.logo} alt={settings.storeName} width={64} height={64} className="rounded-full" />
            <div className="leading-none">
              <div className="font-display text-2xl tracking-[0.25em]">{mark.main}</div>
              {mark.sub && <div className="mt-1 text-[9px] tracking-[0.5em] text-rose">{mark.sub}</div>}
            </div>
          </Link>
          <p className="mt-5 text-sm leading-relaxed text-cocoa-light">{settings.footerAbout}</p>
          {socials.length > 0 && (
            <div className="mt-6 flex gap-3">
              {socials.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-blush-300 text-cocoa transition hover:border-rose hover:bg-rose hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="eyebrow mb-5">Shop</h3>
          <ul className="space-y-3 text-sm text-cocoa-light">
            <li><Link href="/shop" className="hover:text-rose">All Products</Link></li>
            <li><Link href="/shop?filter=new" className="hover:text-rose">New Arrivals</Link></li>
            <li><Link href="/shop?filter=best" className="hover:text-rose">Best Sellers</Link></li>
            <li><Link href="/shop?filter=sale" className="hover:text-rose">On Sale</Link></li>
            {categories.slice(0, 5).map((c) => (
              <li key={c.slug}><Link href={`/shop?category=${c.slug}`} className="hover:text-rose">{c.name}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="eyebrow mb-5">Help</h3>
          <ul className="space-y-3 text-sm text-cocoa-light">
            <li><Link href="/track-order" className="hover:text-rose">Track Your Order</Link></li>
            {pages.map((p) => (
              <li key={p.slug}><Link href={`/pages/${p.slug}`} className="hover:text-rose">{p.title}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="eyebrow mb-5">Contact</h3>
          <ul className="space-y-4 text-sm text-cocoa-light">
            {settings.phone && (
              <li className="flex gap-3"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-rose" /><a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="hover:text-rose">{settings.phone}</a></li>
            )}
            {settings.email && (
              <li className="flex gap-3"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-rose" /><a href={`mailto:${settings.email}`} className="hover:text-rose">{settings.email}</a></li>
            )}
            {settings.address && (
              <li className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-rose" /><span>{settings.address}</span></li>
            )}
          </ul>
          {settings.scriptLines?.footer && <p className="mt-6 font-script text-3xl text-rose">{settings.scriptLines.footer}</p>}
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-6 text-xs text-muted sm:flex-row">
          <p>© {new Date().getFullYear()} {settings.storeName}. All rights reserved.</p>
          <p className="tracking-[0.3em] uppercase">{settings.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
