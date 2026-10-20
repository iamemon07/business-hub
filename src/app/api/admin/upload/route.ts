import { createHash } from "node:crypto";
import { adminRoute, ApiError, ok } from "@/lib/api";
import { env } from "@/lib/env";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

export const GET = adminRoute(async () => {
  const { cloudName, apiKey, apiSecret } = env.CLOUDINARY;
  return ok({ enabled: Boolean(cloudName && apiKey && apiSecret) });
});

/**
 * Uploads an image to Cloudinary (free tier) using a server-side signature,
 * so the API secret never reaches the browser. Returns the optimised HTTPS URL.
 */
export const POST = adminRoute(async (req, { tenant }) => {
  const { cloudName, apiKey, apiSecret } = env.CLOUDINARY;
  if (!cloudName || !apiKey || !apiSecret)
    throw new ApiError(400, "Image upload is not configured. Add Cloudinary keys to .env, or paste an image URL instead.");

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) throw new ApiError(400, "No file received");
  if (!ALLOWED.includes(file.type)) throw new ApiError(400, "Only JPG, PNG, WEBP, AVIF or GIF images are allowed");
  if (file.size > MAX_BYTES) throw new ApiError(400, "Image must be smaller than 10 MB");

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `hub/${tenant.slug}`;
  const signature = createHash("sha1").update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`).digest("hex");

  const body = new FormData();
  body.append("file", file);
  body.append("api_key", apiKey);
  body.append("timestamp", String(timestamp));
  body.append("folder", folder);
  body.append("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body });
  const json = (await res.json()) as { secure_url?: string; error?: { message: string } };
  if (!res.ok || !json.secure_url) throw new ApiError(502, json.error?.message || "Upload failed");

  // Inject automatic format/quality for faster storefront loading.
  const url = json.secure_url.replace("/image/upload/", "/image/upload/f_auto,q_auto/");
  return ok({ url });
});
