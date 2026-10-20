import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { isValidObjectId } from "mongoose";
import { z } from "zod";
import { ApiError, ok, platformRoute, readJson } from "@/lib/api";
import { businessUrl } from "@/lib/hosts";
import { signSso } from "@/lib/session";
import { runWithTenant } from "@/lib/tenant-context";
import { Admin } from "@/models/Admin";
import { Tenant } from "@/models/platform";

async function load(params: Promise<{ id: string }>) {
  const { id } = await params;
  if (!isValidObjectId(id)) throw new ApiError(400, "Invalid id");
  const tenant = await Tenant.findById(id).lean();
  if (!tenant) throw new ApiError(404, "Business not found");
  return tenant;
}

function firstOwner(tenantId: string) {
  return runWithTenant(tenantId, () => Admin.findOne({ role: "owner", active: true }).sort({ createdAt: 1 }).lean());
}

/** GET: the business's owner accounts (for the console). */
export const GET = platformRoute<{ id: string }>(async (_req, { params }) => {
  const tenant = await load(params);
  const admins = await runWithTenant(String(tenant._id), () => Admin.find().sort({ createdAt: 1 }).lean());
  return ok(admins.map((a) => ({ _id: String(a._id), name: a.name, email: a.email, role: a.role, active: a.active, lastLoginAt: a.lastLoginAt })));
});

/** POST: one-minute sign-in link to the business's admin panel ("Open store admin"). */
export const POST = platformRoute<{ id: string }>(async (_req, { params, admin }) => {
  const tenant = await load(params);
  const owner = await firstOwner(String(tenant._id));
  if (!owner) throw new ApiError(409, "This business has no active owner account");
  const token = await signSso({ tid: String(tenant._id), sub: String(owner._id), by: admin.name, jti: randomUUID() });
  return ok({ url: businessUrl(tenant, `/api/auth/sso?token=${encodeURIComponent(token)}`) });
});

const resetSchema = z.object({
  adminId: z.string().regex(/^[a-f0-9]{24}$/i).optional(),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
});

/** PUT: reset a store admin's password (defaults to the first owner). */
export const PUT = platformRoute<{ id: string }>(async (req, { params }) => {
  const tenant = await load(params);
  const { adminId, password } = resetSchema.parse(await readJson(req));
  const tid = String(tenant._id);
  const target = adminId ? await runWithTenant(tid, () => Admin.findById(adminId).lean()) : await firstOwner(tid);
  if (!target) throw new ApiError(404, "Account not found");
  await runWithTenant(tid, () =>
    Admin.updateOne({ _id: target._id }, { passwordHash: bcrypt.hashSync(password, 12), active: true }),
  );
  return ok({ email: target.email });
});
