import "server-only";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const env = {
  get MONGODB_URI() {
    return required("MONGODB_URI");
  },
  SMTP: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
  },
  CLOUDINARY: cloudinaryConfig(),
};

/**
 * Supports either CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
 * or the three separate CLOUDINARY_* variables. Placeholder values count as "not configured".
 */
function cloudinaryConfig() {
  let cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  let apiKey = process.env.CLOUDINARY_API_KEY;
  let apiSecret = process.env.CLOUDINARY_API_SECRET;
  const url = process.env.CLOUDINARY_URL;
  if (url) {
    try {
      const u = new URL(url);
      if (u.protocol === "cloudinary:") {
        cloudName = cloudName || u.hostname;
        apiKey = apiKey || decodeURIComponent(u.username);
        apiSecret = apiSecret || decodeURIComponent(u.password);
      }
    } catch {
      console.warn("[env] CLOUDINARY_URL is not a valid cloudinary:// URL");
    }
  }
  const isPlaceholder = (v?: string) => !v || v.startsWith("<") || v.startsWith("%3C");
  if ([cloudName, apiKey, apiSecret].some(isPlaceholder)) return { cloudName: undefined, apiKey: undefined, apiSecret: undefined };
  return { cloudName, apiKey, apiSecret };
}
