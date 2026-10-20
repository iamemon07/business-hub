import { ApiError, ok, platformRoute } from "@/lib/api";
import { assertSlugAvailable } from "@/services/provision";

/** Live availability check for the "store address" field in the create-business form. */
export const GET = platformRoute(async (req) => {
  const slug = (new URL(req.url).searchParams.get("slug") ?? "").trim().toLowerCase();
  try {
    await assertSlugAvailable(slug);
    return ok({ available: true, message: "Available" });
  } catch (e) {
    if (e instanceof ApiError) return ok({ available: false, message: e.message });
    throw e;
  }
});
