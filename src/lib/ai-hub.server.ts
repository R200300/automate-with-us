import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** Writes an automation audit entry. Uses the admin client because the logs table is append-only for users. */
export async function logAutomationEvent(params: {
  userId: string;
  actor?: string | null;
  eventType: string;
  entityType: string;
  entityId?: string | null;
  message: string;
  level?: "info" | "warning" | "error";
  metadata?: Record<string, unknown>;
}) {
  const { error } = await supabaseAdmin.from("automation_activity_logs").insert({
    user_id: params.userId,
    actor: params.actor ?? params.userId,
    event_type: params.eventType,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    message: params.message,
    level: params.level ?? "info",
    metadata: (params.metadata ?? {}) as never,
  });
  if (error) console.error("[ai-hub] failed to write activity log", error.message);
}

type UsageDelta = Partial<{
  ai_requests: number;
  chat_messages: number;
  voice_calls: number;
  workflow_executions: number;
  documents_processed: number;
  input_tokens: number;
  output_tokens: number;
}>;

function currentPeriod() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

/** Increments the signed-in user's usage counters for the current month. */
export async function bumpUsage(userId: string, delta: UsageDelta) {
  const period = currentPeriod();

  const { data: existing } = await supabaseAdmin
    .from("ai_usage")
    .select("*")
    .eq("user_id", userId)
    .eq("period_month", period)
    .maybeSingle();

  if (!existing) {
    const { error } = await supabaseAdmin.from("ai_usage").insert({
      user_id: userId,
      period_month: period,
      ai_requests: delta.ai_requests ?? 0,
      chat_messages: delta.chat_messages ?? 0,
      voice_calls: delta.voice_calls ?? 0,
      workflow_executions: delta.workflow_executions ?? 0,
      documents_processed: delta.documents_processed ?? 0,
      input_tokens: delta.input_tokens ?? 0,
      output_tokens: delta.output_tokens ?? 0,
    });
    if (error) console.error("[ai-hub] usage insert failed", error.message);
    return;
  }

  const { error } = await supabaseAdmin
    .from("ai_usage")
    .update({
      ai_requests: existing.ai_requests + (delta.ai_requests ?? 0),
      chat_messages: existing.chat_messages + (delta.chat_messages ?? 0),
      voice_calls: existing.voice_calls + (delta.voice_calls ?? 0),
      workflow_executions: existing.workflow_executions + (delta.workflow_executions ?? 0),
      documents_processed: existing.documents_processed + (delta.documents_processed ?? 0),
      input_tokens: existing.input_tokens + (delta.input_tokens ?? 0),
      output_tokens: existing.output_tokens + (delta.output_tokens ?? 0),
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id);
  if (error) console.error("[ai-hub] usage update failed", error.message);
}

/** Returns the request quota state for the current month without inventing numbers. */
export async function readUsage(userId: string) {
  const period = currentPeriod();
  const { data } = await supabaseAdmin
    .from("ai_usage")
    .select("*")
    .eq("user_id", userId)
    .eq("period_month", period)
    .maybeSingle();

  return {
    period,
    aiRequests: data?.ai_requests ?? 0,
    chatMessages: data?.chat_messages ?? 0,
    voiceCalls: data?.voice_calls ?? 0,
    workflowExecutions: data?.workflow_executions ?? 0,
    documentsProcessed: data?.documents_processed ?? 0,
    inputTokens: data?.input_tokens ?? 0,
    outputTokens: data?.output_tokens ?? 0,
    requestLimit: data?.request_limit ?? 500,
  };
}

/** Creates an in-app notification (the notifications table is insert-restricted for users). */
export async function createNotification(params: {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
}) {
  const { error } = await supabaseAdmin.from("notifications").insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    message: params.message,
    link: params.link ?? null,
  });
  if (error) console.error("[ai-hub] notification insert failed", error.message);
}
