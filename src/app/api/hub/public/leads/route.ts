import { ApiError, ok, platformPublicRoute, readJson } from "@/lib/api";
import { mailEnabled, sendMail } from "@/lib/mail";
import { leadSchema } from "@/lib/platform-validators";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { Lead, PlatformSettings } from "@/models/platform";

/** "Start my store" requests from the public landing page. */
export const POST = platformPublicRoute(async (req) => {
  if (!rateLimit(`lead:${clientIp(req)}`, 5, 60 * 60 * 1000).ok) throw new ApiError(429, "Too many requests. Please try again later.");
  const settings = await PlatformSettings.findOne({ key: "platform" }).lean();
  if (settings && !settings.leadsEnabled) throw new ApiError(403, "We're not taking new requests right now.");
  const { website: _honeypot, ...data } = leadSchema.parse(await readJson(req));
  const lead = await Lead.create(data);
  if (settings?.supportEmail && mailEnabled()) {
    await sendMail({
      to: settings.supportEmail,
      fromName: settings.name,
      replyTo: data.email,
      subject: `New store request: ${data.businessName || data.name}`,
      html: `<p><b>${data.name}</b> (${data.phone}${data.email ? `, ${data.email}` : ""}) wants a store.</p>
        <p>Business: ${data.businessName || "—"}<br/>Niche: ${data.template || "—"}<br/>Plan: ${data.plan || "—"}</p>
        <p>${data.message.replace(/</g, "&lt;")}</p>`,
    });
  }
  return ok({ id: String(lead._id) }, { status: 201 });
});
