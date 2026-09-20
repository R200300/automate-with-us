import { sendLovableEmail } from "@lovable.dev/email-js";

const BRAND = {
  name: "InstaLoop",
  tagline: "AI automation for growing businesses",
  primary: "#2563EB",
  dark: "#0F172A",
  accent: "#22C55E",
  address: "Sector 22, Gurgaon, Haryana, India 122015",
  replyTo: "hello@nexoraautomation.com",
};

export interface LeadEmailData {
  id: string;
  full_name: string;
  company_name: string;
  email: string;
  phone: string;
  country: string;
  service: string;
  project_description: string;
  created_at: string;
}

function shell(title: string, inner: string) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${BRAND.dark};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;border:1px solid #E2E8F0;border-radius:16px;overflow:hidden;">
<tr><td style="background-color:${BRAND.dark};padding:24px 28px;">
<div style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">InstaLoop<span style="color:${BRAND.accent};">.</span></div>
<div style="font-size:12px;color:#94A3B8;margin-top:4px;">${BRAND.tagline}</div>
</td></tr>
<tr><td style="padding:28px;">${inner}</td></tr>
<tr><td style="background-color:#F8FAFC;padding:20px 28px;font-size:12px;color:#64748B;line-height:1.6;">
${BRAND.name} · ${BRAND.address}<br/>
Serving businesses in the USA, Canada, UK &amp; Australia.
</td></tr>
</table></td></tr></table></body></html>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function row(label: string, value: string) {
  return `<tr>
<td style="padding:8px 0;font-size:13px;color:#64748B;width:170px;vertical-align:top;">${escapeHtml(label)}</td>
<td style="padding:8px 0;font-size:14px;color:${BRAND.dark};font-weight:600;">${escapeHtml(value).replace(/\n/g, "<br/>")}</td>
</tr>`;
}

export function customerConfirmationEmail(lead: LeadEmailData) {
  const html = shell(
    "We've received your consultation request",
    `<h1 style="margin:0 0 12px;font-size:24px;line-height:1.3;">Thank you, ${escapeHtml(lead.full_name.split(" ")[0])} 🎉</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155;">
We've received your consultation request for <strong style="color:${BRAND.primary};">${escapeHtml(lead.service)}</strong>. An InstaLoop automation specialist is reviewing your requirements now.
</p>
<div style="background-color:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:16px 18px;margin:0 0 20px;">
<div style="font-size:14px;font-weight:700;color:#15803D;">We'll get back to you within 24 hours.</div>
<div style="font-size:13px;color:#166534;margin-top:4px;">Usually much sooner during business hours.</div>
</div>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 20px;">
${row("Name", lead.full_name)}
${row("Company", lead.company_name)}
${row("Service", lead.service)}
${row("Phone", lead.phone)}
${row("Country", lead.country)}
</table>
<p style="margin:0 0 8px;font-size:14px;font-weight:700;">What happens next</p>
<p style="margin:0 0 20px;font-size:14px;line-height:1.8;color:#334155;">
1. We review your process and prepare ideas.<br/>
2. A specialist contacts you to confirm a time.<br/>
3. We run your free 30-minute discovery call.
</p>
<p style="margin:0;font-size:13px;color:#64748B;">Need to add something? Just reply to this email.</p>`,
  );

  const text = `Thank you, ${lead.full_name}.

We've received your consultation request for ${lead.service}.
Our team will contact you within 24 hours.

Name: ${lead.full_name}
Company: ${lead.company_name}
Service: ${lead.service}
Phone: ${lead.phone}
Country: ${lead.country}

- InstaLoop`;

  return {
    subject: "We've received your consultation request | InstaLoop",
    html,
    text,
  };
}

export function ownerNotificationEmail(lead: LeadEmailData) {
  const html = shell(
    "New lead received",
    `<h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;">New lead received</h1>
<p style="margin:0 0 20px;font-size:14px;color:#334155;">A new consultation request just came in from the website.</p>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 20px;">
${row("Full name", lead.full_name)}
${row("Company", lead.company_name)}
${row("Email", lead.email)}
${row("Phone", lead.phone)}
${row("Country", lead.country)}
${row("Service", lead.service)}
${row("Submitted", new Date(lead.created_at).toUTCString())}
${row("Project description", lead.project_description)}
${row("Lead ID", lead.id)}
</table>
<p style="margin:0;font-size:13px;color:#64748B;">Open the leads dashboard at /admin/leads to update the status.</p>`,
  );

  const text = `New lead received

Name: ${lead.full_name}
Company: ${lead.company_name}
Email: ${lead.email}
Phone: ${lead.phone}
Country: ${lead.country}
Service: ${lead.service}
Submitted: ${lead.created_at}
Project description: ${lead.project_description}
Lead ID: ${lead.id}`;

  return { subject: "New Lead Received – InstaLoop", html, text };
}

export function meetingConfirmationEmail(
  lead: LeadEmailData,
  startsAt: string,
  eventLink: string | null,
) {
  const when = new Date(startsAt).toUTCString();
  const html = shell(
    "Your discovery call is booked",
    `<h1 style="margin:0 0 12px;font-size:24px;line-height:1.3;">Your discovery call is booked ✅</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155;">
Hi ${escapeHtml(lead.full_name.split(" ")[0])}, your free 30-minute call with InstaLoop is confirmed.
</p>
<div style="background-color:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;padding:16px 18px;margin:0 0 20px;">
<div style="font-size:14px;font-weight:700;color:${BRAND.primary};">${escapeHtml(when)}</div>
<div style="font-size:13px;color:#1E40AF;margin-top:4px;">30 minutes · Google Meet</div>
</div>
${
  eventLink
    ? `<a href="${escapeHtml(eventLink)}" style="display:inline-block;background-color:${BRAND.primary};color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 22px;border-radius:999px;">View calendar invite</a>`
    : ""
}
<p style="margin:20px 0 0;font-size:13px;color:#64748B;">Need to reschedule? Just reply to this email.</p>`,
  );
  const text = `Your discovery call with InstaLoop is confirmed for ${when}.${eventLink ? `\nCalendar invite: ${eventLink}` : ""}`;
  return { subject: "Your discovery call is confirmed | InstaLoop", html, text };
}

export function getEmailConfig() {
  const apiKey = process.env.LOVABLE_API_KEY;
  const senderDomain = process.env.SENDER_DOMAIN;
  const ownerEmail = process.env.OWNER_NOTIFICATION_EMAIL;
  return { apiKey, senderDomain, ownerEmail };
}

/** Sends through Lovable's managed email API. Throws with a readable reason on failure. */
export async function sendLeadEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
}) {
  const { apiKey, senderDomain } = getEmailConfig();
  if (!apiKey) throw new Error("Email service is not configured (missing API key).");
  if (!senderDomain)
    throw new Error(
      "No verified sender domain is configured yet, so emails cannot be delivered. Set up the email domain in Cloud → Emails.",
    );

  const result = await sendLovableEmail(
    {
      to: params.to,
      from: `InstaLoop <hello@${senderDomain}>`,
      sender_domain: senderDomain,
      reply_to: BRAND.replyTo,
      subject: params.subject,
      html: params.html,
      text: params.text,
      idempotency_key: params.idempotencyKey,
    },
    { apiKey, idempotencyKey: params.idempotencyKey },
  );

  if (!result.success) throw new Error(result.status || "Email provider rejected the message.");
  return result;
}
