import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { env } from "./env";

let transporter: Transporter | null = null;

export function mailEnabled() {
  return Boolean(env.SMTP.host && env.SMTP.user && env.SMTP.pass && !env.SMTP.pass.startsWith("<"));
}

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP.host,
      port: env.SMTP.port,
      secure: env.SMTP.port === 465,
      auth: { user: env.SMTP.user, pass: env.SMTP.pass },
    });
  }
  return transporter;
}

/** Sends an email; returns false (and logs) instead of throwing so checkout never fails on SMTP issues. */
export async function sendMail(opts: { to: string; subject: string; html: string; text?: string; fromName?: string; replyTo?: string }) {
  if (!mailEnabled()) {
    console.warn("[mail] SMTP not configured — skipping email to", opts.to);
    return false;
  }
  try {
    const { fromName, replyTo, ...mail } = opts;
    // One platform mailbox sends for every business, under the business's name; replies go to the business.
    const address = env.SMTP.from?.match(/<([^>]+)>/)?.[1] ?? env.SMTP.from ?? env.SMTP.user;
    const from = fromName ? `"${fromName.replace(/"/g, "")}" <${address}>` : env.SMTP.from;
    await getTransporter().sendMail({ from, replyTo: replyTo || undefined, ...mail });
    return true;
  } catch (err) {
    console.error("[mail] failed to send", err);
    return false;
  }
}
