import Image from "next/image";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/LoginForm";
import { brandAsset, getStore } from "@/lib/store";

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ sso?: string }> }) {
  const [{ tenant, settings }, { sso }] = await Promise.all([getStore(), searchParams]);
  const logo = settings.logo || brandAsset(tenant.id, "logo");
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,var(--color-blush-100),var(--color-cream)_60%)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Image src={logo} alt={settings.storeName} width={110} height={110} className="mx-auto h-[110px] w-[110px] rounded-full object-cover shadow-lg shadow-rose/10" priority />
          <h1 className="mt-5 font-display text-3xl">{settings.storeName}</h1>
          <p className="text-sm text-muted">Sign in to manage your store</p>
        </div>
        {sso && <p className="mb-4 rounded-xl bg-amber-50 p-3 text-center text-xs text-amber-800">That sign-in link has expired. Open the store admin again from the console.</p>}
        <div className="card p-7 shadow-xl shadow-cocoa/5">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
