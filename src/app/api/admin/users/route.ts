import bcrypt from "bcryptjs";
import { adminRoute, ApiError, ok, readJson } from "@/lib/api";
import { adminUserSchema } from "@/lib/validators";
import { Admin } from "@/models/Admin";
import { assertWithinLimit } from "@/services/plan-limits";

export const GET = adminRoute(async () => ok(await Admin.find().sort({ createdAt: 1 }).lean()), { ownerOnly: true });

export const POST = adminRoute(
  async (req, { tenant }) => {
    await assertWithinLimit(tenant, "staff");
    const { password, ...data } = adminUserSchema.parse(await readJson(req));
    if (!password) throw new ApiError(422, "Password is required for new users");
    const admin = await Admin.create({ ...data, passwordHash: await bcrypt.hash(password, 12) });
    const { passwordHash: _omit, ...safe } = admin.toObject();
    return ok(safe, { status: 201 });
  },
  { ownerOnly: true },
);
