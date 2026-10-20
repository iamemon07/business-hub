"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Building2, CreditCard, ExternalLink, Inbox, LayoutDashboard, LogOut, Menu, Plus, Settings, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/console", label: "Dashboard", icon: LayoutDashboard },
  { href: "/console/businesses", label: "Businesses", icon: Building2 },
  { href: "/console/plans", label: "Plans & Pricing", icon: CreditCard },
  { href: "/console/leads", label: "Leads", icon: Inbox },
  { href: "/console/settings", label: "Platform Settings", icon: Settings },
];

export function ConsoleSidebar({ user, platformName, newLeads }: { user: { name: string; email: string }; platformName: string; newLeads: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const logout = async () => {
    await fetch("/api/hub/auth/logout", { method: "POST" });
    router.replace("/console/login");
    router.refresh();
  };
  const isActive = (href: string) => (href === "/console" ? pathname === "/console" : pathname.startsWith(href));

  const nav = (
    <div className="flex h-full flex-col">
      <Link href="/console" className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose text-lg font-semibold text-white">
          {platformName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-base font-semibold text-cocoa">{platformName}</p>
          <p className="text-[10px] uppercase tracking-[0.25em] text-rose">Super Admin</p>
        </div>
      </Link>
      <div className="px-3 pb-4">
        <Link href="/console/businesses/new" className="btn-primary w-full">
          <Plus className="h-4 w-4" /> New Business
        </Link>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
              isActive(href) ? "bg-cocoa text-ivory shadow-md shadow-cocoa/15" : "text-cocoa-light hover:bg-blush-100",
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="flex-1">{label}</span>
            {href === "/console/leads" && newLeads > 0 && (
              <span className="rounded-full bg-rose px-2 py-0.5 text-[10px] font-semibold text-white">{newLeads}</span>
            )}
          </Link>
        ))}
      </nav>
      <div className="border-t border-line p-4">
        <Link href="/" target="_blank" className="mb-3 flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-cocoa-light hover:bg-blush-100">
          <ExternalLink className="h-4 w-4" /> View Landing Page
        </Link>
        <div className="flex items-center gap-3 rounded-xl bg-blush-50 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cocoa text-sm font-semibold text-white">{user.name.charAt(0).toUpperCase()}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-[11px] text-muted">{user.email}</p>
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
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-cream/90 px-4 py-3 backdrop-blur lg:hidden">
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="p-1.5"><Menu className="h-5 w-5" /></button>
        <p className="font-semibold">{platformName}</p>
        <span className="w-8" />
      </div>
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line bg-cream lg:block">{nav}</aside>
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
