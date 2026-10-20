import bcrypt from "bcryptjs";
import { isValidObjectId } from "mongoose";
import { z } from "zod";
import { ApiError, ok, platformRoute, readJson } from "@/lib/api";
import { platformAdminSchema } from "@/lib/platform-validators";
import { PlatformAdmin } from "@/models/platform";

/** Super admin accounts. */
export const GET = platformRoute(async () => ok(await PlatformAdmin.find().sort({ createdAt: 1 }).lean()));

export const POST = platformRoute(async (req) => {
  const { password, ...data } = platformAdminSchema.parse(await readJson(req));
  const admin = await PlatformAdmin.create({ ...data, passwordHash: await bcrypt.hash(password, 12) });
  const { passwordHash: _omit, ...safe } = admin.toObject();
  return ok(safe, { status: 201 });
});

/** Change own password: { currentPassword, newPassword } */
export const PUT = platformRoute(async (req, { admin }) => {
  const { currentPassword, newPassword } = z
    .object({ currentPassword: z.string().min(1), newPassword: z.string().min(8, "New password must be at least 8 characters").max(100) })
    .parse(await readJson(req));
  const me = await PlatformAdmin.findById(admin.sub).select("+passwordHash");
  if (!me || !(await bcrypt.compare(currentPassword, me.passwordHash))) throw new ApiError(400, "Current password is incorrect");
  me.passwordHash = await bcrypt.hash(newPassword, 12);
  await me.save();
  return ok({ updated: true });
});

export const DELETE = platformRoute(async (req, { admin }) => {
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!isValidObjectId(id)) throw new ApiError(400, "Invalid id");
  if (id === admin.sub) throw new ApiError(409, "You can't delete your own account");
  if ((await PlatformAdmin.countDocuments({ active: true, _id: { $ne: id } })) === 0)
    throw new ApiError(409, "Keep at least one super admin");
  await PlatformAdmin.deleteOne({ _id: id });
  return ok({ id });
});
