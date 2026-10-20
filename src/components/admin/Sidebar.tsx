"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BadgePercent,
  BarChart3,
  CreditCard,
  ExternalLink,
  FileText,
  FolderTree,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PiggyBank,
  RefreshCw,
  Receipt,
  Settings,
  ShoppingCart,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }>; ownerOnly?: boolean };

const GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Store",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/categories", label: "Categories", icon: FolderTree },
      { href: "/admin/coupons", label: "Coupons", icon: BadgePercent },
    ],
  },
  {
    title: "Content",
    items: [
      { href: "/admin/banners", label: "Banners", icon: ImageIcon },
      { href: "/admin/pages", label: "Pages", icon: FileText },
      { href: "/admin/settings", label: "Site Settings", icon: Settings },
    ],
  },
  {
    title: "Finance",
    items: [
      { href: "/admin/finance", label: "P&L / ROI", icon: BarChart3, ownerOnly: true },
      { href: "/admin/expenses", label: "Expenses", icon: Receipt },
      { href: "/admin/investments", label: "Investments", icon: PiggyBank, ownerOnly: true },
    ],
  },
  {
    title: "Account",
    items: [
      { href: "/admin/users", label: "Team", icon: Users, ownerOnly: true },
      { href: "/admin/subscription", label: "Subscription", icon: CreditCard, ownerOnly: true },
    ],
  },
];

export function Sidebar({
  user,
  store,
}: {
  user: { name: string; email: string; role: string; viaPlatform?: boolean };
  store: { name: string; logo: string };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  const [refreshing, setRefreshing] = useState(false);
  const refreshStore = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/revalidate", { method: "POST" });
      if (!res.ok) throw new Error();
      toast.success("Store refreshed — the website now shows the latest data");
    } catch {
      toast.error("Could not refresh the store");
    } finally {
      setRefreshing(false);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  };

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const nav = (
    <div className="flex h-full flex-col">
      <Link href="/admin" className="flex items-center gap-3 px-5 py-6">
        <Image src={store.logo} alt="" width={44} height={44} className="h-11 w-11 shrink-0 rounded-full object-cover" />
        <div className="min-w-0 leading-none">
          <p className="truncate font-display text-lg text-cocoa">{store.name}</p>
          <p className="mt-1 text-[9px] uppercase tracking-[0.35em] text-rose">{user.viaPlatform ? "Support access" : "Admin"}</p>
        </div>
      </Link>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
        {GROUPS.map((g) => {
          const items = g.items.filter((i) => !i.ownerOnly || user.role === "owner");
          if (!items.length) return null;
          return (
            <div key={g.title}>
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-muted/70">{g.title}</p>
              <ul className="space-y-0.5">
                {items.map(({ href, label, icon: Icon }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                        isActive(href) ? "bg-cocoa text-ivory shadow-md shadow-cocoa/15" : "text-cocoa-light hover:bg-blush-100",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>
      <div className="border-t border-line p-4">
        <Link href="/" target="_blank" className="mb-3 flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-cocoa-light hover:bg-blush-100">
          <ExternalLink className="h-4 w-4" /> View Store
        </Link>
        <button
          onClick={refreshStore}
          disabled={refreshing}
          title="Clear the website cache so it shows the latest products, banners and settings"
          className="mb-3 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-cocoa-light hover:bg-blush-100 disabled:opacity-50"
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} /> Refresh Store
        </button>
        <div className="flex items-center gap-3 rounded-xl bg-blush-50 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose text-sm font-semibold text-white">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-[11px] capitalize text-muted">{user.role}</p>
          </div>
          <button onClick={logout} aria-label="Log out" className="rounded-lg p-2 text-muted hover:bg-white hover:text-red-600">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-cream/90 px-4 py-3 backdrop-blur lg:hidden print:hidden">
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="p-1.5"><Menu className="h-5 w-5" /></button>
        <p className="truncate font-display text-lg">{store.name}</p>
        <span className="w-8" />
      </div>
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line bg-cream lg:block print:hidden">{nav}</aside>
      <div className={cn("fixed inset-0 z-50 lg:hidden", open ? "" : "pointer-events-none")}>
        <div onClick={() => setOpen(false)} className={cn("absolute inset-0 bg-cocoa/30 transition-opacity", open ? "opacity-100" : "opacity-0")} />
        <aside className={cn("absolute inset-y-0 left-0 w-72 bg-cream shadow-2xl transition-transform", open ? "translate-x-0" : "-translate-x-full")}>
          <button onClick={() => setOpen(false)} className="absolute right-3 top-5 p-1.5" aria-label="Close menu"><X className="h-5 w-5" /></button>
          {nav}
        </aside>
      </div>
    </>
  );
}
