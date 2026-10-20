import { ok } from "@/lib/api";
import { clearPlatformCookie } from "@/lib/auth";

export async function POST() {
  await clearPlatformCookie();
  return ok({ loggedOut: true });
}
