import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Sidebar } from "@/components/admin/Sidebar";
import { requireAdminPage } from "@/lib/auth";
import { brandAsset, getStore } from "@/lib/store";
import { subscriptionNotice } from "@/services/subscription";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminPage();
  const { tenant, settings } = await getStore();
  const notice = subscriptionNotice(tenant);

  return (
    <>
      <Sidebar
        user={{ name: session.name, email: session.email, role: session.role, viaPlatform: session.via === "platform" }}
        store={{ name: settings.storeName, logo: settings.logo || brandAsset(tenant.id, "logo") }}
      />
      <main className="lg:pl-64 print:pl-0">
        {notice && (
          <div
            className={
              notice.tone === "red"
                ? "border-b border-red-200 bg-red-50 text-red-800 print:hidden"
                : "border-b border-amber-200 bg-amber-50 text-amber-900 print:hidden"
            }
          >
            <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 text-sm sm:px-6 lg:px-10">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <p className="flex-1">{notice.text}</p>
              {session.role === "owner" && (
                <Link href="/admin/subscription" className="shrink-0 font-medium underline underline-offset-4">
                  Subscription
                </Link>
              )}
            </div>
          </div>
        )}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10 print:max-w-none print:p-0">{children}</div>
      </main>
    </>
  );
}
