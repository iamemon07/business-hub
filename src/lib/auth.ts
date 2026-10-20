import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  PLATFORM_COOKIE,
  PLATFORM_TTL_SECONDS,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  signPlatformSession,
  signSession,
  verifyPlatformSession,
  verifySession,
  type PlatformSessionPayload,
  type SessionPayload,
} from "./session";
import { currentTenant } from "./tenant";

const cookieOpts = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge,
});

/* ───────────── Store admins ───────────── */

/** The store admin session — only valid on the business it was issued for. */
export async function getSession() {
  const store = await cookies();
  const session = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const tenant = await currentTenant();
  if (!tenant || tenant.id !== session.tid) return null;
  return session;
}

/** For Server Components / pages: redirect to login when not authenticated. */
export async function requireAdminPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  return session;
}

export async function createSessionCookie(payload: SessionPayload) {
  const store = await cookies();
  store.set(SESSION_COOKIE, await signSession(payload), cookieOpts(SESSION_TTL_SECONDS));
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/* ───────────── Super admins (platform console) ───────────── */

export async function getPlatformSession() {
  const store = await cookies();
  return verifyPlatformSession(store.get(PLATFORM_COOKIE)?.value);
}

export async function requirePlatformPage() {
  const session = await getPlatformSession();
  if (!session) redirect("/console/login");
  return session;
}

export async function createPlatformCookie(payload: PlatformSessionPayload) {
  const store = await cookies();
  store.set(PLATFORM_COOKIE, await signPlatformSession(payload), cookieOpts(PLATFORM_TTL_SECONDS));
}

export async function clearPlatformCookie() {
  const store = await cookies();
  store.delete(PLATFORM_COOKIE);
}
