import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RichText } from "@/components/RichText";
import { getStore } from "@/lib/store";
import { getPage } from "@/services/catalog";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { tenant } = await getStore();
  const page = await getPage(tenant.id, (await params).slug);
  return { title: page?.title ?? "Page not found" };
}

export default async function ContentPage({ params }: { params: Params }) {
  const { tenant, settings } = await getStore();
  const page = await getPage(tenant.id, (await params).slug);
  if (!page) notFound();
  return (
    <div className="container-x max-w-3xl py-16">
      <p className="eyebrow mb-3 text-center">{settings.storeName}</p>
      <h1 className="heading-display mb-12 text-center text-5xl">{page.title}</h1>
      <RichText content={page.content} />
    </div>
  );
}
