import { isValidObjectId } from "mongoose";
import { PageHeader } from "@/components/admin/ui";
import { CreateBusinessForm } from "@/components/hub/CreateBusinessForm";
import { connectDB } from "@/lib/db";
import { platformDomain, platformProtocol } from "@/lib/hosts";
import { serialize } from "@/lib/serialize";
import { Lead, Plan } from "@/models/platform";
import { getPlatformSettings } from "@/services/platform";
import { templateSummaries } from "@/templates";

export const metadata = { title: "New Business" };

export default async function NewBusinessPage({ searchParams }: { searchParams: Promise<{ lead?: string }> }) {
  const { lead: leadId } = await searchParams;
  await connectDB();
  const [plans, settings, lead] = await Promise.all([
    Plan.find({ active: true }).sort({ sortOrder: 1, priceMonthly: 1 }).select("name priceMonthly").lean(),
    getPlatformSettings(),
    leadId && isValidObjectId(leadId) ? Lead.findById(leadId).lean() : null,
  ]);

  return (
    <div>
      <PageHeader title="New Business" description="Creates a complete store — storefront, admin panel, owner login and starter content — in one step." />
      <CreateBusinessForm
        templates={templateSummaries()}
        plans={serialize(plans)}
        domain={platformDomain()}
        protocol={platformProtocol()}
        defaults={{ currency: settings.currencySymbol, trialDays: settings.trialDays }}
        lead={lead ? serialize<{ _id: string; name: string; businessName: string; email: string; phone: string; template: string }>(lead) : null}
      />
    </div>
  );
}
