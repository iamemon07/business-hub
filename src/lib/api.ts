import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { connectDB } from "./db";
import { getPlatformSession, getSession } from "./auth";
import { currentTenant, isClosed } from "./tenant";
import { runAsPlatform, runWithTenant } from "./tenant-context";
import type { PlatformSessionPayload, SessionPayload } from "./session";
import type { TenantInfo } from "@/types";

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ success: true, data }, init);
}

function handleError(err: unknown) {
  if (err instanceof ApiError) {
    return NextResponse.json({ success: false, error: err.message, details: err.details }, { status: err.status });
  }
  if (err instanceof ZodError) {
    const first = err.errors[0];
    const message = first ? `${first.path.join(".") || "input"}: ${first.message}` : "Invalid input";
    return NextResponse.json(
      { success: false, error: message, details: err.flatten().fieldErrors },
      { status: 422 },
    );
  }
  if (typeof err === "object" && err && "code" in err && (err as { code: number }).code === 11000) {
    const keys = Object.keys((err as { keyValue?: object }).keyValue ?? {})
      .filter((k) => k !== "tenant")
      .join(", ");
    return NextResponse.json(
      { success: false, error: `That ${keys || "value"} is already in use` },
      { status: 409 },
    );
  }
  console.error("[api]", err);
  return NextResponse.json({ success: false, error: "Something went wrong. Please try again." }, { status: 500 });
}

type Ctx<P> = { params: Promise<P> };

async function requireRequestTenant() {
  const tenant = await currentTenant();
  if (!tenant) throw new ApiError(404, "Store not found");
  return tenant;
}

/** Storefront route: resolves the business from the host and scopes all queries to it. */
export function publicRoute<P = Record<string, string>>(
  fn: (req: Request, ctx: Ctx<P> & { tenant: TenantInfo }) => Promise<Response>,
  opts: { allowClosed?: boolean } = {},
) {
  return async (req: Request, ctx: Ctx<P>) => {
    try {
      await connectDB();
      const tenant = await requireRequestTenant();
      if (isClosed(tenant) && !opts.allowClosed) throw new ApiError(403, "This store is currently unavailable");
      return await runWithTenant(tenant.id, () => fn(req, { ...ctx, tenant }));
    } catch (err) {
      return handleError(err);
    }
  };
}

/** Store admin route: verifies the session belongs to this business (defence in depth beyond middleware). */
export function adminRoute<P = Record<string, string>>(
  fn: (req: Request, ctx: Ctx<P> & { session: SessionPayload; tenant: TenantInfo }) => Promise<Response>,
  opts: { ownerOnly?: boolean } = {},
) {
  return async (req: Request, ctx: Ctx<P>) => {
    try {
      await connectDB();
      const tenant = await requireRequestTenant();
      const session = await getSession();
      if (!session) throw new ApiError(401, "Unauthorized");
      if (opts.ownerOnly && session.role !== "owner") throw new ApiError(403, "Owner access required");
      if (isClosed(tenant) && req.method !== "GET")
        throw new ApiError(403, "This store is suspended — changes are disabled. Please contact the platform.");
      return await runWithTenant(tenant.id, () => fn(req, { ...ctx, session, tenant }));
    } catch (err) {
      return handleError(err);
    }
  };
}

/** Super admin route. Runs in platform scope — business data must be filtered explicitly. */
export function platformRoute<P = Record<string, string>>(
  fn: (req: Request, ctx: Ctx<P> & { admin: PlatformSessionPayload }) => Promise<Response>,
) {
  return async (req: Request, ctx: Ctx<P>) => {
    try {
      const admin = await getPlatformSession();
      if (!admin) throw new ApiError(401, "Unauthorized");
      await connectDB();
      return await runAsPlatform(() => fn(req, { ...ctx, admin }));
    } catch (err) {
      return handleError(err);
    }
  };
}

/** Public platform route (landing page forms, console login). No business data access. */
export function platformPublicRoute<P = Record<string, string>>(fn: (req: Request, ctx: Ctx<P>) => Promise<Response>) {
  return async (req: Request, ctx: Ctx<P>) => {
    try {
      await connectDB();
      return await runAsPlatform(() => fn(req, ctx));
    } catch (err) {
      return handleError(err);
    }
  };
}

export async function readJson(req: Request) {
  try {
    return await req.json();
  } catch {
    throw new ApiError(400, "Invalid JSON body");
  }
}
