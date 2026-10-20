import type { Metadata } from "next";
import { ThemeStyle } from "@/components/ThemeStyle";
import { brandAsset, getStore } from "@/lib/store";

export async function generateMetadata(): Promise<Metadata> {
  const { tenant, settings } = await getStore();
  const logo = settings.logo || brandAsset(tenant.id, "logo");
  return {
    title: { default: "Admin", template: `%s · ${settings.storeName} Admin` },
    robots: { index: false, follow: false },
    icons: { icon: logo },
  };
}

export const dynamic = "force-dynamic";

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const { settings } = await getStore();
  return (
    <div className="min-h-screen bg-admin-bg print:bg-white">
      <ThemeStyle theme={settings.theme} />
      {children}
    </div>
  );
}
