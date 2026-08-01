import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const PIPELINE_STAGES = [
  "New",
  "Contacted",
  "Discovery Scheduled",
  "Qualified",
  "Proposal Sent",
  "Negotiation",
  "Won",
  "Lost",
] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const TASK_STATUSES = ["Open", "In Progress", "Done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export interface CrmLead {
  id: string;
  created_at: string;
  updated_at: string;
  full_name: string;
  company_name: string;
  email: string;
  phone: string;
  country: string;
  service: string;
  project_description: string;
  lead_source: string;
  priority: Priority;
  pipeline_stage: PipelineStage;
  next_followup: string | null;
  last_contact: string | null;
  estimated_value: number;
  closing_probability: number;
  company_size: string | null;
  industry: string | null;
  website: string | null;
  timezone: string | null;
  meeting_date: string | null;
  meeting_link: string | null;
  assigned_to: string | null;
  assigned_user: string | null;
  notes: string | null;
  seen_at: string | null;
  customer_email_status: string;
  customer_email_error: string | null;
  owner_email_status: string;
  owner_email_error: string | null;
}

export interface CrmNote {
  id: string;
  lead_id: string;
  note: string;
  created_by: string | null;
  created_at: string;
}

export interface CrmTask {
  id: string;
  lead_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: string;
  priority: Priority;
  assigned_to: string | null;
  created_at: string;
}

// Keeping the select string as `string` avoids supabase-js parsing it at the type level.
const sel = (s: string): string => s;

const LEAD_COLUMNS = sel(
  "id, created_at, updated_at, full_name, company_name, email, phone, country, service, project_description, lead_source, priority, pipeline_stage, next_followup, last_contact, estimated_value, closing_probability, company_size, industry, website, timezone, meeting_date, meeting_link, assigned_to, assigned_user, notes, seen_at, customer_email_status, customer_email_error, owner_email_status, owner_email_error",
);

export const listCrmLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("leads")
      .select(LEAD_COLUMNS)
      .order("created_at", { ascending: false })
      .returns<CrmLead[]>();
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getCrmLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { leadId: string }) => z.object({ leadId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const lead = await context.supabase
      .from("leads")
      .select(LEAD_COLUMNS)
      .eq("id", data.leadId)
      .maybeSingle()
      .returns<CrmLead>();
    if (lead.error) throw new Error(lead.error.message);
    if (!lead.data) throw new Error("Lead not found or you do not have access to it.");

    const [activity, notes, tasks] = await Promise.all([
      context.supabase
        .from("lead_activity")
        .select("id, event_type, message, created_at")
        .eq("lead_id", data.leadId)
        .order("created_at", { ascending: false }),
      context.supabase
        .from("notes")
        .select("id, lead_id, note, created_by, created_at")
        .eq("lead_id", data.leadId)
        .order("created_at", { ascending: false })
        .returns<CrmNote[]>(),
      context.supabase
        .from("tasks")
        .select("id, lead_id, title, description, due_date, status, priority, assigned_to, created_at")
        .eq("lead_id", data.leadId)
        .order("created_at", { ascending: false })
        .returns<CrmTask[]>(),
    ]);

    return {
      lead: lead.data,
      activity: activity.data ?? [],
      notes: notes.data ?? [],
      tasks: tasks.data ?? [],
    };
  });

const leadUpdateSchema = z.object({
  leadId: z.string().uuid(),
  patch: z
    .object({
      pipeline_stage: z.enum(PIPELINE_STAGES).optional(),
      priority: z.enum(PRIORITIES).optional(),
      lead_source: z.string().trim().max(80).optional(),
      assigned_to: z.string().trim().max(120).nullable().optional(),
      next_followup: z.string().nullable().optional(),
      last_contact: z.string().nullable().optional(),
      estimated_value: z.number().min(0).max(100_000_000).optional(),
      closing_probability: z.number().int().min(0).max(100).optional(),
      company_size: z.string().trim().max(80).nullable().optional(),
      industry: z.string().trim().max(120).nullable().optional(),
      website: z.string().trim().max(200).nullable().optional(),
      timezone: z.string().trim().max(80).nullable().optional(),
      meeting_date: z.string().nullable().optional(),
      meeting_link: z.string().trim().max(500).nullable().optional(),
      notes: z.string().trim().max(5000).nullable().optional(),
    })
    .refine((p) => Object.keys(p).length > 0, "Nothing to update"),
});

export const updateCrmLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: z.input<typeof leadUpdateSchema>) => leadUpdateSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: before } = await context.supabase
      .from("leads")
      .select("pipeline_stage, priority")
      .eq("id", data.leadId)
      .maybeSingle();

    const patch = { ...data.patch, seen_at: new Date().toISOString() };
    const { error } = await context.supabase
      .from("leads")
      .update(patch as never)
      .eq("id", data.leadId);
    if (error) throw new Error(error.message);

    const { logActivity } = await import("./lead-notifications.server");
    if (data.patch.pipeline_stage && data.patch.pipeline_stage !== before?.pipeline_stage) {
      await logActivity(
        data.leadId,
        "stage_changed",
        `Pipeline stage moved from ${before?.pipeline_stage ?? "unknown"} to ${data.patch.pipeline_stage}.`,
        { from: before?.pipeline_stage, to: data.patch.pipeline_stage },
        context.userId,
      );
    } else {
      await logActivity(
        data.leadId,
        "lead_updated",
        `Lead record updated (${Object.keys(data.patch).join(", ")}).`,
        data.patch as Record<string, unknown>,
        context.userId,
      );
    }
    return { ok: true };
  });

export const addCrmNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { leadId: string; note: string }) =>
    z.object({ leadId: z.string().uuid(), note: z.string().trim().min(1).max(5000) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("notes")
      .insert({ lead_id: data.leadId, note: data.note, created_by: context.userId });
    if (error) throw new Error(error.message);
    const { logActivity } = await import("./lead-notifications.server");
    await logActivity(data.leadId, "note_added", "Internal note added.", {}, context.userId);
    return { ok: true };
  });

export const deleteCrmNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { noteId: string }) => z.object({ noteId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("notes").delete().eq("id", data.noteId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const taskSchema = z.object({
  leadId: z.string().uuid(),
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(2000).optional().nullable(),
  due_date: z.string().nullable().optional(),
  priority: z.enum(PRIORITIES).default("Medium"),
});

export const createCrmTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: z.input<typeof taskSchema>) => taskSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("tasks").insert({
      lead_id: data.leadId,
      title: data.title,
      description: data.description ?? null,
      due_date: data.due_date ?? null,
      priority: data.priority,
      assigned_to: context.userId,
      status: "Open",
    });
    if (error) throw new Error(error.message);
    const { logActivity } = await import("./lead-notifications.server");
    await logActivity(data.leadId, "task_created", `Task created: ${data.title}`, {}, context.userId);
    return { ok: true };
  });

export const updateCrmTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { taskId: string; status: TaskStatus }) =>
    z.object({ taskId: z.string().uuid(), status: z.enum(TASK_STATUSES) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: task, error } = await context.supabase
      .from("tasks")
      .update({ status: data.status })
      .eq("id", data.taskId)
      .select("lead_id, title")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (task) {
      const { logActivity } = await import("./lead-notifications.server");
      await logActivity(
        task.lead_id,
        "task_updated",
        `Task "${task.title}" marked ${data.status}.`,
        { status: data.status },
        context.userId,
      );
    }
    return { ok: true };
  });

export const deleteCrmTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { taskId: string }) => z.object({ taskId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("tasks").delete().eq("id", data.taskId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listOpenTasks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("tasks")
      .select("id, lead_id, title, description, due_date, status, priority, assigned_to, created_at")
      .neq("status", "Done")
      .order("due_date", { ascending: true, nullsFirst: false })
      .returns<CrmTask[]>();
    if (error) throw new Error(error.message);
    return data ?? [];
  });
