import type { Metadata } from "next";
import { ThemeStyle } from "@/components/ThemeStyle";
import { platformUrl } from "@/lib/hosts";
import { PLATFORM_THEME } from "@/lib/theme";
import { getPlatformSettings } from "@/services/platform";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getPlatformSettings().catch(() => null);
  const name = s?.name ?? "Business Hub";
  return {
    metadataBase: new URL(platformUrl()),
    title: { default: `${name} — ${s?.tagline ?? "Launch your online store"}`, template: `%s · ${name}` },
    description: s?.hero.subtitle,
  };
}

export default function HubLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ThemeStyle theme={PLATFORM_THEME} />
      {children}
    </>
  );
}
