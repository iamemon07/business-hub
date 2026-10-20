import { NextResponse } from "next/server";
import { createSessionCookie } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { verifySso } from "@/lib/session";
import { currentTenant, requestHost } from "@/lib/tenant";
import { runWithTenant } from "@/lib/tenant-context";
import { Admin } from "@/models/Admin";

// Single-use guard for SSO tokens (they also expire after 60 seconds).
const used = new Map<string, number>();

/**
 * Super admin "Open store admin": exchanges a one-minute token from the console for a
 * store admin session on this business's own domain.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  // Redirect on the business's own host (req.url can carry an internal host behind proxies).
  const proto = req.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  const origin = `${proto}://${(await requestHost()) || url.host}`;
  const fail = () => NextResponse.redirect(new URL("/admin/login?sso=expired", origin));

  const token = await verifySso(url.searchParams.get("token") ?? undefined);
  if (!token) return fail();

  const now = Date.now();
  for (const [k, exp] of used) if (exp < now) used.delete(k);
  if (used.has(token.jti)) return fail();

  await connectDB();
  const tenant = await currentTenant();
  if (!tenant || tenant.id !== token.tid) return fail();
  const admin = await runWithTenant(tenant.id, () => Admin.findById(token.sub).lean());
  if (!admin || !admin.active) return fail();
  used.set(token.jti, now + 120_000);

  await createSessionCookie({
    sub: String(admin._id),
    tid: tenant.id,
    email: admin.email,
    name: `${token.by} (Support)`,
    role: "owner",
    via: "platform",
  });
  return NextResponse.redirect(new URL("/admin", origin));
}
