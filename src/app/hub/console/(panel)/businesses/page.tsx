import Link from "next/link";
import { PageHeader } from "@/components/admin/ui";
import { BusinessTable } from "@/components/hub/BusinessTable";
import { getPlatformSettings } from "@/services/platform";
import { listBusinesses } from "@/services/platform-stats";

export const metadata = { title: "Businesses" };

export default async function BusinessesPage() {
  const [rows, settings] = await Promise.all([listBusinesses(), getPlatformSettings()]);
  return (
    <div>
      <PageHeader
        title="Businesses"
        description={`${rows.length} business${rows.length === 1 ? "" : "es"} on ${settings.name}.`}
        actions={<Link href="/console/businesses/new" className="btn-primary">New Business</Link>}
      />
      <BusinessTable rows={rows} currency={settings.currencySymbol} />
    </div>
  );
}
