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

async function attempt(
  lead: LeadEmailData,
  kind: "customer" | "owner",
  to: string,
  payload: { subject: string; html: string; text: string },
  attemptsSoFar: number,
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const prefix = kind === "customer" ? "customer" : "owner";
  const maxAttempts = 3;
  let lastError = "";

  for (let i = 0; i < maxAttempts; i++) {
    try {
      await sendLeadEmail({ ...payload, to, idempotencyKey: `${prefix}-${lead.id}` });
      await supabaseAdmin
        .from("leads")
        .update({
          [`${prefix}_email_status`]: "sent",
          [`${prefix}_email_attempts`]: attemptsSoFar + i + 1,
          [`${prefix}_email_error`]: null,
        } as never)
        .eq("id", lead.id);
      await logActivity(lead.id, "email_sent", `${kind === "customer" ? "Customer confirmation" : "Internal notification"} email sent to ${to}.`, { kind, to });
      return true;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      // Retry only transient failures; configuration problems will not fix themselves.
      if (/not configured|sender domain/i.test(lastError)) break;
      await new Promise((r) => setTimeout(r, 400 * (i + 1)));
    }
  }

  await supabaseAdmin
    .from("leads")
    .update({
      [`${prefix}_email_status`]: "failed",
      [`${prefix}_email_attempts`]: attemptsSoFar + maxAttempts,
      [`${prefix}_email_error`]: lastError,
    } as never)
    .eq("id", lead.id);
  await logActivity(lead.id, "email_failed", `${kind === "customer" ? "Customer confirmation" : "Internal notification"} email failed: ${lastError}`, { kind, to, error: lastError });
  return false;
}

/** Best-effort: never throws, so a failed email can never lose the lead. */
export async function dispatchLeadEmails(lead: LeadEmailData, attemptsSoFar = 0) {
  const { ownerEmail } = getEmailConfig();

  const results = await Promise.allSettled([
    attempt(lead, "customer", lead.email, customerConfirmationEmail(lead), attemptsSoFar),
    ownerEmail
      ? attempt(lead, "owner", ownerEmail, ownerNotificationEmail(lead), attemptsSoFar)
      : Promise.resolve(false),
  ]);

  return {
    customer: results[0].status === "fulfilled" && results[0].value,
    owner: results[1].status === "fulfilled" && results[1].value,
  };
}
