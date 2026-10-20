import { revalidatePath } from "next/cache";
import { adminRoute, ok } from "@/lib/api";
import { revalidateTenant } from "@/services/settings";

/** Clears all cached storefront data — useful after bulk imports or direct database edits. */
export const POST = adminRoute(async (_req, { tenant }) => {
  revalidateTenant(tenant.id);
  revalidatePath("/", "layout");
  return ok({ refreshed: true });
});
