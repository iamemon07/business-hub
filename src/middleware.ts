import { NextResponse, type NextRequest } from "next/server";
import { classifyHost } from "@/lib/hosts";
import { PLATFORM_COOKIE, SESSION_COOKIE, verifyPlatformSession, verifySession } from "@/lib/session";

const unauthorized = () => NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
const notFound = () => NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

/**
 * Routes each request by hostname:
 *  - platform host  → landing page + super admin console (served from app/hub/*)
 *  - business host  → storefront (app/(store)) + store admin (app/admin)
 * Fine-grained checks (session ↔ business match, roles) happen again on the server.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = classifyHost(req.headers.get("x-forwarded-host") ?? req.headers.get("host"));

  // Generated logos/banners are addressed by business id, so they work from any host.
  if (pathname.startsWith("/api/brand/")) return NextResponse.next();

  if (host.kind === "platform") {
    if (pathname.startsWith("/api/")) {
      if (!pathname.startsWith("/api/hub/")) return notFound();
      const isPublic = pathname.startsWith("/api/hub/public/") || pathname.startsWith("/api/hub/auth/");
      if (!isPublic && !(await verifyPlatformSession(req.cookies.get(PLATFORM_COOKIE)?.value))) return unauthorized();
      return NextResponse.next();
    }

    if (pathname === "/console" || pathname.startsWith("/console/")) {
      const session = await verifyPlatformSession(req.cookies.get(PLATFORM_COOKIE)?.value);
      if (pathname === "/console/login") {
        if (session) return NextResponse.redirect(new URL("/console", req.url));
      } else if (!session) {
        const url = new URL("/console/login", req.url);
        url.searchParams.set("next", pathname);
        return NextResponse.redirect(url);
      }
    }

    const url = req.nextUrl.clone();
    url.pathname = `/hub${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  // ── Business host ──
  if (pathname === "/hub" || pathname.startsWith("/hub/") || pathname.startsWith("/api/hub/")) {
    return pathname.startsWith("/api/") ? notFound() : NextResponse.rewrite(new URL("/not-found-page", req.url));
  }

  const isAdminApi = pathname.startsWith("/api/admin");
  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  if (!isAdminApi && !isAdminPage) return NextResponse.next();

  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (isAdminApi) return session ? NextResponse.next() : unauthorized();

  // No "already logged in" redirect here: only the server can tell whether the session belongs
  // to *this* business, and redirecting on a foreign session would loop.
  if (pathname === "/admin/login" || pathname === "/admin/sso") return NextResponse.next();
  if (!session) {
    const url = new URL("/admin/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Everything except Next internals and static files (anything with a file extension).
  matcher: ["/((?!_next/|.*\\.[a-zA-Z0-9]+$).*)"],
};
