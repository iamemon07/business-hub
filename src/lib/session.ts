import { SignJWT, jwtVerify } from "jose";

/** Edge-safe JWT helpers (used by middleware and server code). */
export const SESSION_COOKIE = "store_session";
export const PLATFORM_COOKIE = "hub_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
export const PLATFORM_TTL_SECONDS = 60 * 60 * 12; // 12 hours

/** A store admin, bound to one business (`tid`). */
export type SessionPayload = {
  sub: string;
  tid: string;
  email: string;
  name: string;
  role: "owner" | "staff";
  /** Set when a super admin opened this store's admin from the console. */
  via?: "platform";
};

/** A super admin of the whole platform. */
export type PlatformSessionPayload = { sub: string; email: string; name: string };

const AUD = { tenant: "store-admin", platform: "platform-admin", sso: "store-sso" } as const;

function key() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET must be set (min 32 chars)");
  return new TextEncoder().encode(secret);
}

async function sign(payload: Record<string, unknown>, audience: string, ttlSeconds: number) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(key());
}

async function verify<T>(token: string | undefined, audience: string): Promise<T | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"], audience });
    return payload as unknown as T;
  } catch {
    return null;
  }
}

export const signSession = (p: SessionPayload) => sign(p, AUD.tenant, SESSION_TTL_SECONDS);
export const verifySession = (t: string | undefined) => verify<SessionPayload>(t, AUD.tenant);

export const signPlatformSession = (p: PlatformSessionPayload) => sign(p, AUD.platform, PLATFORM_TTL_SECONDS);
export const verifyPlatformSession = (t: string | undefined) => verify<PlatformSessionPayload>(t, AUD.platform);

/** One-minute token a super admin uses to open a business's admin panel. */
export type SsoPayload = { tid: string; sub: string; by: string; jti: string };
export const signSso = (p: SsoPayload) => sign(p, AUD.sso, 60);
export const verifySso = (t: string | undefined) => verify<SsoPayload>(t, AUD.sso);
