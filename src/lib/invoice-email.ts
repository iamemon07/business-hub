import { palette } from "./theme";
import { formatDate, formatPrice, lineOptions } from "./utils";
import { PAYMENT_LABELS, STATUS_LABELS, type OrderDTO, type SettingsDTO } from "@/types";

const esc = (s: string | number | undefined | null) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/**
 * Email clients fetch images from the public internet, so the logo must be an absolute public URL.
 * Cloudinary logos are resized to a small PNG (Outlook doesn't render WebP/AVIF from f_auto).
 * Returns null when no reachable URL exists (e.g. a relative path while running on localhost).
 */
function emailLogoUrl(logo: string, siteUrl: string) {
  if (logo.includes("res.cloudinary.com") && logo.includes("/image/upload/")) {
    const [base, rest] = logo.split("/image/upload/");
    return `${base}/image/upload/c_fill,w_192,h_192,f_png,q_auto/${rest.replace(/^f_auto,q_auto\//, "")}`;
  }
  // Generated SVG logos don't render in most email clients — fall back to the text wordmark.
  if (!logo || /\.svg(\?|$)/.test(logo)) return null;
  if (/^https?:\/\//.test(logo)) return logo;
  if (/localhost|127\.0\.0\.1/.test(siteUrl)) return null;
  return `${siteUrl}${logo}`;
}

function logoBlock(settings: SettingsDTO, siteUrl: string) {
  const C = palette(settings.theme);
  const url = emailLogoUrl(settings.logo, siteUrl);
  return url
    ? `<img src="${esc(url)}" alt="${esc(settings.storeName)}" width="96" height="96" style="border-radius:50%;display:inline-block;border:0;outline:none;" />`
    : `<div style="font-size:26px;letter-spacing:6px;color:${C["cocoa"]};">${esc(settings.storeName.toUpperCase())}</div>`;
}

/** Inline-styled HTML invoice that renders well in Gmail/Outlook. */
export function invoiceEmailHtml(order: OrderDTO, settings: SettingsDTO, siteUrl: string) {
  const C = palette(settings.theme);
  const cur = settings.currencySymbol;
  const p = (n: number) => esc(formatPrice(n, cur));
  const wallet =
    order.paymentMethod === "bkash" || order.paymentMethod === "nagad" || order.paymentMethod === "rocket"
      ? settings.payments[order.paymentMethod]
      : null;

  const rows = order.items
    .map(
      (i) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid ${C["blush-100"]};">
          <div style="font-weight:600;color:${C["cocoa"]};">${esc(i.name)}</div>
          <div style="font-size:12px;color:${C["muted"]};">${esc(lineOptions(i.size, i.color))}</div>
        </td>
        <td style="padding:12px 0;border-bottom:1px solid ${C["blush-100"]};text-align:center;color:${C["cocoa"]};">${i.quantity}</td>
        <td style="padding:12px 0;border-bottom:1px solid ${C["blush-100"]};text-align:right;color:${C["cocoa"]};">${p(i.unitPrice)}</td>
        <td style="padding:12px 0;border-bottom:1px solid ${C["blush-100"]};text-align:right;color:${C["cocoa"]};font-weight:600;">${p(i.lineTotal)}</td>
      </tr>`,
    )
    .join("");

  const paymentBlock =
    order.paymentStatus === "paid"
      ? `<p style="margin:0;color:#2f6b3a;font-weight:600;">Payment received ✓</p>`
      : order.paymentMethod === "cod"
        ? `<p style="margin:0;">Please keep <strong>${p(order.total)}</strong> ready to pay in cash on delivery.</p>`
        : wallet
          ? `<p style="margin:0 0 6px;">We received your ${esc(PAYMENT_LABELS[order.paymentMethod])} payment details and will verify them shortly.</p>
             <p style="margin:0;font-size:13px;color:${C["muted"]};">Sender: ${esc(order.senderNumber)} · TrxID: ${esc(order.transactionId)}</p>`
          : order.paymentMethod === "bank"
            ? `<p style="margin:0 0 6px;">Please transfer <strong>${p(order.total)}</strong> to:</p><pre style="margin:0;font-family:inherit;white-space:pre-wrap;">${esc(settings.payments.bank.details)}</pre>`
            : "";

  return `<!doctype html>
<html><body style="margin:0;background:${C["blush-50"]};font-family:Georgia,'Times New Roman',serif;color:${C["cocoa"]};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C["blush-50"]};padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:${C["ivory"]};border-radius:16px;overflow:hidden;border:1px solid ${C["line"]};">
        <tr><td style="padding:28px 32px;text-align:center;border-bottom:1px solid ${C["blush-100"]};">
          ${logoBlock(settings, siteUrl)}
          <h1 style="margin:12px 0 4px;font-size:24px;font-weight:normal;letter-spacing:2px;">Thank you for your order</h1>
          <p style="margin:0;color:${C["muted"]};font-size:14px;">${esc(settings.tagline)}</p>
        </td></tr>

        <tr><td style="padding:24px 32px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;">
          <p style="margin:0 0 16px;">Hi ${esc(order.customer.name)},</p>
          <p style="margin:0 0 16px;">We've received your order and it's now <strong>${esc(STATUS_LABELS[order.status])}</strong>. Here's your invoice.</p>

          <table role="presentation" width="100%" style="background:${C["blush-50"]};border-radius:12px;padding:16px;margin-bottom:20px;">
            <tr>
              <td style="padding:4px 12px;"><div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:${C["muted"]};">Invoice / Order</div><div style="font-weight:700;">#${esc(order.orderNumber)}</div></td>
              <td style="padding:4px 12px;"><div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:${C["muted"]};">Date</div><div style="font-weight:700;">${esc(formatDate(order.createdAt))}</div></td>
              <td style="padding:4px 12px;"><div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:${C["muted"]};">Estimated Delivery</div><div style="font-weight:700;">${esc(formatDate(order.estimatedDelivery.from, { day: "numeric", month: "short" }))} – ${esc(formatDate(order.estimatedDelivery.to, { day: "numeric", month: "short", year: "numeric" }))}</div></td>
            </tr>
          </table>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <thead><tr>
              <th align="left" style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:${C["muted"]};padding-bottom:8px;border-bottom:2px solid ${C["blush-200"]};">Item</th>
              <th style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:${C["muted"]};padding-bottom:8px;border-bottom:2px solid ${C["blush-200"]};">Qty</th>
              <th align="right" style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:${C["muted"]};padding-bottom:8px;border-bottom:2px solid ${C["blush-200"]};">Price</th>
              <th align="right" style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:${C["muted"]};padding-bottom:8px;border-bottom:2px solid ${C["blush-200"]};">Total</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>

          <table role="presentation" width="100%" style="margin-top:16px;">
            <tr><td style="color:${C["muted"]};">Subtotal</td><td align="right">${p(order.subtotal)}</td></tr>
            ${order.discount > 0 ? `<tr><td style="color:${C["muted"]};">Discount${order.couponCode ? ` (${esc(order.couponCode)})` : ""}</td><td align="right">−${p(order.discount)}</td></tr>` : ""}
            <tr><td style="color:${C["muted"]};">Delivery</td><td align="right">${order.shippingFee === 0 ? "Free" : p(order.shippingFee)}</td></tr>
            <tr><td style="padding-top:10px;border-top:1px solid ${C["blush-200"]};font-size:18px;font-weight:700;">Total</td><td align="right" style="padding-top:10px;border-top:1px solid ${C["blush-200"]};font-size:18px;font-weight:700;">${p(order.total)}</td></tr>
          </table>

          <table role="presentation" width="100%" style="margin-top:24px;">
            <tr>
              <td valign="top" style="width:50%;padding-right:12px;">
                <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:${C["muted"]};margin-bottom:6px;">Shipping to</div>
                <div>${esc(order.customer.name)}<br/>${esc(order.customer.phone)}<br/>${esc(order.shipping.address)}${order.shipping.area ? `, ${esc(order.shipping.area)}` : ""}<br/>${esc(order.shipping.city)}</div>
              </td>
              <td valign="top" style="width:50%;padding-left:12px;">
                <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:${C["muted"]};margin-bottom:6px;">Payment · ${esc(PAYMENT_LABELS[order.paymentMethod])}</div>
                ${paymentBlock}
              </td>
            </tr>
          </table>

          <div style="text-align:center;margin:28px 0 8px;">
            <a href="${esc(siteUrl)}/order/${esc(order.orderNumber)}?phone=${encodeURIComponent(order.customer.phone)}" style="display:inline-block;background:${C["cocoa"]};color:${C["ivory"]};text-decoration:none;padding:12px 28px;border-radius:999px;font-size:13px;letter-spacing:1px;text-transform:uppercase;">View / Track Order</a>
          </div>
        </td></tr>

        <tr><td style="padding:20px 32px;background:${C["blush-100"]};text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${C["muted"]};line-height:1.6;">
          ${esc(settings.invoice.footerNote)}<br/>
          ${esc(settings.storeName)} · ${esc(settings.phone)} · ${esc(settings.email)}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export function adminOrderEmailHtml(order: OrderDTO, settings: SettingsDTO, siteUrl: string) {
  const cur = settings.currencySymbol;
  return `<div style="font-family:Arial,sans-serif;font-size:14px;color:#222">
    <h2 style="margin:0 0 8px">New order #${esc(order.orderNumber)} — ${esc(formatPrice(order.total, cur))}</h2>
    <p>${esc(order.customer.name)} · ${esc(order.customer.phone)}<br/>${esc(order.shipping.address)}, ${esc(order.shipping.city)}</p>
    <p>Payment: ${esc(PAYMENT_LABELS[order.paymentMethod])}${order.transactionId ? ` (TrxID ${esc(order.transactionId)})` : ""}</p>
    <ul>${order.items.map((i) => `<li>${esc(i.name)} ${lineOptions(i.size, "") ? `(${esc(i.size)})` : ""} × ${i.quantity}</li>`).join("")}</ul>
    <p><a href="${esc(siteUrl)}/admin/orders/${esc(order._id)}">Open in admin</a></p>
  </div>`;
}
