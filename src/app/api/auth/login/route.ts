import bcrypt from "bcryptjs";
import { ApiError, ok, publicRoute, readJson } from "@/lib/api";
import { createSessionCookie } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validators";
import { Admin } from "@/models/Admin";

// Constant-time-ish dummy hash so unknown emails take as long as wrong passwords.
const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEeO5z3i3m4k5x1Yq3GmH8sWwYc3x1s3a3K";

export const POST = publicRoute(async (req, { tenant }) => {
  const ip = clientIp(req);
  if (!rateLimit(`login:${tenant.id}:${ip}`, 8, 15 * 60 * 1000).ok)
    throw new ApiError(429, "Too many login attempts. Please wait 15 minutes.");

  const { email, password } = loginSchema.parse(await readJson(req));
  const admin = await Admin.findOne({ email }).select("+passwordHash");
  const valid = await bcrypt.compare(password, admin?.passwordHash ?? DUMMY_HASH);
  if (!admin || !valid || !admin.active) throw new ApiError(401, "Invalid email or password");

  admin.lastLoginAt = new Date();
  await admin.save();
  await createSessionCookie({
    sub: String(admin._id),
    tid: tenant.id,
    email: admin.email,
    name: admin.name,
    role: admin.role as "owner" | "staff",
  });
  return ok({ name: admin.name });
}, { allowClosed: true });
