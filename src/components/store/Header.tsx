"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Search, ShoppingBag, X, Package } from "lucide-react";
import { cartCount, useCart } from "@/store/cart";
import { cn, wordmarkOf } from "@/lib/utils";
import { useHydrated } from "./StoreContext";

type Props = {
  logo: string;
  storeName: string;
  wordmark?: { main: string; sub: string };
  scriptLine?: string;
  searchPlaceholder?: string;
  categories: { name: string; slug: string }[];
};

export function Header({ logo, storeName, wordmark, scriptLine, searchPlaceholder, categories }: Props) {
  const mark = wordmarkOf(storeName, wordmark);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const items = useCart((s) => s.items);
  const openCart = useCart((s) => s.open);
  const hydrated = useHydrated();
  const pathname = usePathname();
  const router = useRouter();
  const count = hydrated ? cartCount(items) : 0;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  const nav = [
    { href: "/shop?filter=new", label: "New Arrivals" },
    ...categories.slice(0, 4).map((c) => ({ href: `/shop?category=${c.slug}`, label: c.name })),
    { href: "/shop?filter=sale", label: "Sale" },
  ];

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) router.push(`/shop?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-all duration-300 print:hidden",
        scrolled ? "bg-cream/90 shadow-[0_1px_0_0_var(--color-line)] backdrop-blur-md" : "bg-cream",
      )}
    >
      <div className="container-x flex h-16 items-center justify-between gap-4 lg:h-20">
        <div className="flex items-center gap-2 lg:hidden">
          <button aria-label="Open menu" onClick={() => setMenuOpen(true)} className="-ml-2 p-2">
            <Menu className="h-5 w-5" />
          </button>
        </div>

        <Link href="/" className="flex items-center gap-3" aria-label={`${storeName} home`}>
          <Image src={logo} alt={storeName} width={56} height={56} className="h-11 w-11 rounded-full lg:h-14 lg:w-14" priority />
          <div className="hidden leading-none sm:block">
            <div className="font-display text-xl tracking-[0.25em] lg:text-2xl">{mark.main}</div>
            {mark.sub && <div className="mt-1 text-[9px] tracking-[0.5em] text-rose">{mark.sub}</div>}
          </div>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          <Link href="/shop" className="text-[13px] tracking-wider text-cocoa/80 transition hover:text-rose">
            Shop All
          </Link>
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="text-[13px] tracking-wider text-cocoa/80 transition hover:text-rose">
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <button aria-label="Search" onClick={() => setSearchOpen((v) => !v)} className="p-2 transition hover:text-rose">
            <Search className="h-5 w-5" />
          </button>
          <Link href="/track-order" aria-label="Track order" className="hidden p-2 transition hover:text-rose sm:block">
            <Package className="h-5 w-5" />
          </Link>
          <button aria-label="Open cart" onClick={openCart} className="relative p-2 transition hover:text-rose">
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose px-1 text-[10px] font-semibold text-white">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="animate-fade-in border-t border-line bg-ivory">
          <form onSubmit={submitSearch} className="container-x flex items-center gap-3 py-4">
            <Search className="h-4 w-4 text-muted" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={searchPlaceholder ?? "Search…"}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted/60"
            />
            <button type="submit" className="text-xs uppercase tracking-widest text-rose">
              Search
            </button>
          </form>
        </div>
      )}

      {/* Mobile drawer */}
      <div className={cn("fixed inset-0 z-50 lg:hidden", menuOpen ? "pointer-events-auto" : "pointer-events-none")}>
        <div
          onClick={() => setMenuOpen(false)}
          className={cn("absolute inset-0 bg-cocoa/30 transition-opacity", menuOpen ? "opacity-100" : "opacity-0")}
        />
        <aside
          className={cn(
            "absolute left-0 top-0 h-full w-[82%] max-w-sm bg-cream p-6 shadow-2xl transition-transform duration-300",
            menuOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="mb-8 flex items-center justify-between">
            <Image src={logo} alt={storeName} width={52} height={52} className="rounded-full" />
            <button aria-label="Close menu" onClick={() => setMenuOpen(false)} className="p-2">
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex flex-col">
            {[{ href: "/shop", label: "Shop All" }, ...nav, { href: "/track-order", label: "Track Order" }].map((n) => (
              <Link key={n.href} href={n.href} className="border-b border-line py-4 font-display text-xl tracking-wide">
                {n.label}
              </Link>
            ))}
          </nav>
          {scriptLine && <p className="mt-10 font-script text-2xl text-rose">{scriptLine}</p>}
        </aside>
      </div>
    </header>
  );
}
