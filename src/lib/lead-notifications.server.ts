import {
  customerConfirmationEmail,
  getEmailConfig,
  ownerNotificationEmail,
  sendLeadEmail,
  type LeadEmailData,
} from "./lead-emails.server";

export async function logActivity(
  leadId: string,
  eventType: string,
  message: string,
  metadata: Record<string, unknown> = {},
  actor?: string | null,
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("lead_activity").insert({
    lead_id: leadId,
    event_type: eventType,
    message,
    metadata: metadata as never,
    actor: actor ?? null,
  });
  if (error) console.error("[lead_activity] insert failed", error);
}

async function sendWithRetry(
  lead: LeadEmailData,
  kind: "customer" | "owner",
  to: string,
  payload: { subject: string; html: string; text: string },
  attemptsSoFar: number,
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const maxAttempts = 3;
  let lastError = "";

  for (let i = 0; i < maxAttempts; i++) {
    try {
      await sendLeadEmail({
        ...payload,
        to,
        idempotencyKey: `lead-email-${kind}-${lead.id}`,
      });
      await supabaseAdmin
        .from("leads")
        .update({
          [`${kind}_email_status`]: "sent",
          [`${kind}_email_attempts`]: attemptsSoFar + i + 1,
          [`${kind}_email_error`]: null,
        } as never)
        .eq("id", lead.id);
      await logActivity(lead.id, "email_sent", `${kind === "customer" ? "Customer confirmation" : "Internal notification"} email sent to ${to}.`, { kind, to });
      return true;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      if (/not configured|verified sender|missing api key/i.test(lastError)) break;
      if (i < maxAttempts - 1) await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    }
  }

  await supabaseAdmin
    .from("leads")
    .update({
      [`${kind}_email_status`]: "failed",
      [`${kind}_email_attempts`]: attemptsSoFar + maxAttempts,
      [`${kind}_email_error`]: lastError,
    } as never)
    .eq("id", lead.id);
  await logActivity(lead.id, "email_failed", `${kind === "customer" ? "Customer confirmation" : "Internal notification"} email failed: ${lastError}`, { kind, to, error: lastError });
  return false;
}

export async function dispatchLeadEmails(
  lead: LeadEmailData,
  attemptsSoFar = 0,
  appointment?: { startsAt: string; endsAt?: string; meetingUrl?: string | null; bookingUid?: string },
) {
  const { ownerEmail } = getEmailConfig();
  const results = await Promise.allSettled([
    sendWithRetry(lead, "customer", lead.email, customerConfirmationEmail(lead), attemptsSoFar),
    sendWithRetry(
      lead,
      "owner",
      ownerEmail,
      ownerNotificationEmail(lead, appointment),
      attemptsSoFar,
    ),
  ]);

  return {
    customer: results[0].status === "fulfilled" && results[0].value,
    owner: results[1].status === "fulfilled" && results[1].value,
  };
}
