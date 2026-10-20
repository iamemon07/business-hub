import bcrypt from "bcryptjs";
import { adminRoute, ApiError, ok, readJson } from "@/lib/api";
import { passwordChangeSchema } from "@/lib/validators";
import { Admin } from "@/models/Admin";

export const POST = adminRoute(async (req, { session }) => {
  const { currentPassword, newPassword } = passwordChangeSchema.parse(await readJson(req));
  const admin = await Admin.findById(session.sub).select("+passwordHash");
  if (!admin) throw new ApiError(404, "Account not found");
  if (!(await bcrypt.compare(currentPassword, admin.passwordHash)))
    throw new ApiError(400, "Current password is incorrect");
  admin.passwordHash = await bcrypt.hash(newPassword, 12);
  await admin.save();
  return ok({ updated: true });
});
