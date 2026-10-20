import bcrypt from "bcryptjs";
import { isValidObjectId } from "mongoose";
import { adminRoute, ApiError, ok, readJson } from "@/lib/api";
import { adminUserSchema } from "@/lib/validators";
import { Admin } from "@/models/Admin";

async function ensureAnotherOwner(excludeId: string) {
  const owners = await Admin.countDocuments({ role: "owner", active: true, _id: { $ne: excludeId } });
  if (owners === 0) throw new ApiError(409, "You must keep at least one active owner account");
}

export const PUT = adminRoute<{ id: string }>(
  async (req, { params }) => {
    const { id } = await params;
    if (!isValidObjectId(id)) throw new ApiError(400, "Invalid id");
    const { password, ...data } = adminUserSchema.parse(await readJson(req));
    if (data.role !== "owner" || !data.active) await ensureAnotherOwner(id);
    const update: Record<string, unknown> = { ...data };
    if (password) update.passwordHash = await bcrypt.hash(password, 12);
    const doc = await Admin.findByIdAndUpdate(id, update, { new: true, runValidators: true }).lean();
    if (!doc) throw new ApiError(404, "User not found");
    return ok(doc);
  },
  { ownerOnly: true },
);

export const DELETE = adminRoute<{ id: string }>(
  async (_req, { params, session }) => {
    const { id } = await params;
    if (!isValidObjectId(id)) throw new ApiError(400, "Invalid id");
    if (id === session.sub) throw new ApiError(409, "You can't delete your own account");
    await ensureAnotherOwner(id);
    await Admin.findByIdAndDelete(id);
    return ok({ id });
  },
  { ownerOnly: true },
);
