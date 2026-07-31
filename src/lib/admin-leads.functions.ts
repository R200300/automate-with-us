import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const LEAD_STATUSES = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal Sent",
  "Won",
  "Lost",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

const LEAD_COLUMNS =
  "id, created_at, full_name, company_name, email, phone, country, service, project_description, lead_status, source, notes, seen_at, customer_email_status, customer_email_error, owner_email_status, owner_email_error, scheduled_at, calendar_event_link, calendar_status, calendar_error";

async function assertAdmin(context: { supabase: ReturnType<typeof Object> ; userId: string }) {
  const supabase = context.supabase as never as {
    rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: boolean | null; error: unknown }>;
  };
  const { data } = await supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!data) throw new Error("You need an admin role to manage leads.");
}

export const listLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as never);
    const { data, error } = await context.supabase
      .from("leads")
      .select(LEAD_COLUMNS)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getLeadActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { leadId: string }) => z.object({ leadId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { data: rows, error } = await context.supabase
      .from("lead_activity")
      .select("id, event_type, message, created_at, metadata")
      .eq("lead_id", data.leadId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const updateLeadStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { leadId: string; status: LeadStatus }) =>
    z.object({ leadId: z.string().uuid(), status: z.enum(LEAD_STATUSES) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { data: existing } = await context.supabase
      .from("leads")
      .select("lead_status")
      .eq("id", data.leadId)
      .single();

    const { error } = await context.supabase
      .from("leads")
      .update({ lead_status: data.status, seen_at: new Date().toISOString() })
      .eq("id", data.leadId);
    if (error) throw new Error(error.message);

    const { logActivity } = await import("./lead-notifications.server");
    await logActivity(
      data.leadId,
      "status_changed",
      `Status changed from ${existing?.lead_status ?? "unknown"} to ${data.status}.`,
      { from: existing?.lead_status, to: data.status },
      context.userId,
    );
    return { ok: true };
  });

export const markLeadsSeen = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as never);
    const { error } = await context.supabase
      .from("leads")
      .update({ seen_at: new Date().toISOString() })
      .is("seen_at", null);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const retryLeadEmails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { leadId: string }) => z.object({ leadId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { data: lead, error } = await context.supabase
      .from("leads")
      .select(
        "id, full_name, company_name, email, phone, country, service, project_description, created_at, customer_email_attempts",
      )
      .eq("id", data.leadId)
      .single();
    if (error || !lead) throw new Error(error?.message ?? "Lead not found.");

    const { dispatchLeadEmails } = await import("./lead-notifications.server");
    const result = await dispatchLeadEmails(lead, lead.customer_email_attempts ?? 0);
    return result;
  });
