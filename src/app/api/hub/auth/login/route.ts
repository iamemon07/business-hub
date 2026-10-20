import bcrypt from "bcryptjs";
import { ApiError, ok, platformPublicRoute, readJson } from "@/lib/api";
import { createPlatformCookie } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validators";
import { PlatformAdmin } from "@/models/platform";

const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEeO5z3i3m4k5x1Yq3GmH8sWwYc3x1s3a3K";

export const POST = platformPublicRoute(async (req) => {
  if (!rateLimit(`hub-login:${clientIp(req)}`, 6, 15 * 60 * 1000).ok)
    throw new ApiError(429, "Too many login attempts. Please wait 15 minutes.");
  const { email, password } = loginSchema.parse(await readJson(req));
  const admin = await PlatformAdmin.findOne({ email }).select("+passwordHash");
  const valid = await bcrypt.compare(password, admin?.passwordHash ?? DUMMY_HASH);
  if (!admin || !valid || !admin.active) throw new ApiError(401, "Invalid email or password");
  admin.lastLoginAt = new Date();
  await admin.save();
  await createPlatformCookie({ sub: String(admin._id), email: admin.email, name: admin.name });
  return ok({ name: admin.name });
});
