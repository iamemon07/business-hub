import { ConsoleSidebar } from "@/components/hub/ConsoleSidebar";
import { requirePlatformPage } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Lead } from "@/models/platform";
import { getPlatformSettings } from "@/services/platform";

export const metadata = { robots: { index: false, follow: false } };

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePlatformPage();
  await connectDB();
  const [settings, newLeads] = await Promise.all([getPlatformSettings(), Lead.countDocuments({ status: "new" })]);
  return (
    <div className="min-h-screen bg-admin-bg">
      <ConsoleSidebar user={{ name: user.name, email: user.email }} platformName={settings.name} newLeads={newLeads} />
      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">{children}</div>
      </main>
    </div>
  );
}
