import { sendLeadEmail } from "./lead-emails.server";

const DARK = "#0F172A";
const PRIMARY = "#2563EB";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function portalEmailHtml(params: {
  heading: string;
  intro: string;
  rows?: Array<[string, string]>;
  ctaLabel?: string;
  ctaUrl?: string;
  footer?: string;
}) {
  const rows = (params.rows ?? [])
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 0;font-size:13px;color:#64748B;width:40%;">${escapeHtml(label)}</td><td style="padding:8px 0;font-size:13px;font-weight:600;color:${DARK};">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${DARK};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;text-align:left;">
<tr><td style="padding-bottom:20px;font-size:15px;font-weight:800;color:${PRIMARY};">Nexora Automation</td></tr>
<tr><td>
<h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;">${escapeHtml(params.heading)}</h1>
<p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#334155;">${escapeHtml(params.intro)}</p>
${rows ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;">${rows}</table>` : ""}
${
  params.ctaUrl && params.ctaLabel
    ? `<a href="${escapeHtml(params.ctaUrl)}" style="display:inline-block;background:${PRIMARY};color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 22px;border-radius:999px;">${escapeHtml(params.ctaLabel)}</a>`
    : ""
}
<p style="margin:20px 0 0;font-size:12px;color:#94A3B8;">${escapeHtml(params.footer ?? "Nexora Automation · Gurgaon, India")}</p>
</td></tr></table></td></tr></table></body></html>`;
}

/** Creates an in-app notification. Never throws — notifications must not break the action. */
export async function createNotification(params: {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
}) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("notifications").insert({
      user_id: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link ?? null,
    });
    if (error) console.error("[notifications] insert failed", error.message);
  } catch (err) {
    console.error("[notifications] insert threw", err);
  }
}

/** Sends a portal email. Never throws — email delivery must not break the action. */
export async function sendPortalEmail(params: {
  to: string;
  subject: string;
  heading: string;
  intro: string;
  rows?: Array<[string, string]>;
  ctaLabel?: string;
  ctaUrl?: string;
  idempotencyKey: string;
  text?: string;
}) {
  try {
    await sendLeadEmail({
      to: params.to,
      subject: params.subject,
      html: portalEmailHtml(params),
      text: params.text ?? `${params.heading}\n\n${params.intro}`,
      idempotencyKey: params.idempotencyKey,
    });
    return { sent: true as const };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.error("[portal-email] not sent:", reason);
    return { sent: false as const, reason };
  }
}

/** Email of a user id, read with admin access (auth schema is not exposed to RLS clients). */
export async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (error) return null;
    return data.user?.email ?? null;
  } catch {
    return null;
  }
}

export function ownerNotificationEmailAddress() {
  return process.env['OWNER_NOTIFICATION_EMAIL'] ?? null;
}
