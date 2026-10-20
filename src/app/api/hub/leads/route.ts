import { ok, platformRoute } from "@/lib/api";
import { Lead } from "@/models/platform";

export const GET = platformRoute(async () => ok(await Lead.find().sort({ createdAt: -1 }).limit(500).lean()));
