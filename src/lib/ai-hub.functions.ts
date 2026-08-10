import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ActivityLog = {
  id: string;
  event_type: string;
  entity_type: string;
  entity_id: string | null;
  message: string;
  level: string;
  metadata: Record<string, string | number | boolean | null>;
  created_at: string;
};

const LOG_COLUMNS =
  "id, event_type, entity_type, entity_id, message, level, metadata, created_at";

/** Dashboard counters — every number comes from the database. */
export const getAiHubOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { readUsage } = await import("@/lib/ai-hub.server");
    const { supabase, userId } = context;

    const count = (table: "ai_assistants" | "chatbots" | "voice_agents" | "workflows") =>
      supabase.from(table).select("id, status", { count: "exact", head: false });

    const [assistants, chatbots, voice, workflows, bases, documents, prompts, logs, usage] =
      await Promise.all([
        count("ai_assistants"),
        count("chatbots"),
        count("voice_agents"),
        supabase.from("workflows").select("id, is_active, run_count"),
        supabase.from("knowledge_bases").select("id"),
        supabase.from("knowledge_documents").select("id, processing_status"),
        supabase.from("prompts").select("id"),
        supabase
          .from("automation_activity_logs")
          .select(LOG_COLUMNS)
          .order("created_at", { ascending: false })
          .limit(10),
        readUsage(userId),
      ]);

    const activeOf = (rows: Array<{ status?: string }> | null) =>
      (rows ?? []).filter((r) => r.status === "Active").length;

    const workflowRows = workflows.data ?? [];

    return {
      counts: {
        assistants: assistants.data?.length ?? 0,
        activeAssistants: activeOf(assistants.data as Array<{ status?: string }>),
        chatbots: chatbots.data?.length ?? 0,
        activeChatbots: activeOf(chatbots.data as Array<{ status?: string }>),
        voiceAgents: voice.data?.length ?? 0,
        activeVoiceAgents: activeOf(voice.data as Array<{ status?: string }>),
        workflows: workflowRows.length,
        activeWorkflows: workflowRows.filter((w) => w.is_active).length,
        workflowRuns: workflowRows.reduce((sum, w) => sum + (w.run_count ?? 0), 0),
        knowledgeBases: bases.data?.length ?? 0,
        documents: documents.data?.length ?? 0,
        documentsReady: (documents.data ?? []).filter((d) => d.processing_status === "Ready").length,
        prompts: prompts.data?.length ?? 0,
      },
      usage,
      recentActivity: (logs.data ?? []) as unknown as ActivityLog[],
    };
  });

export const getAiUsage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { readUsage } = await import("@/lib/ai-hub.server");
    const usage = await readUsage(context.userId);
    const { data } = await context.supabase
      .from("ai_usage")
      .select(
        "period_month, ai_requests, chat_messages, voice_calls, workflow_executions, documents_processed, input_tokens, output_tokens, request_limit",
      )
      .order("period_month", { ascending: false })
      .limit(12);
    return { usage, history: data ?? [] };
  });

export const listAutomationActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { level?: string; entityType?: string }) =>
    z
      .object({
        level: z.enum(["all", "info", "warning", "error"]).optional(),
        entityType: z.string().trim().max(60).optional(),
      })
      .parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    let query = context.supabase
      .from("automation_activity_logs")
      .select(LOG_COLUMNS)
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.level && data.level !== "all") query = query.eq("level", data.level);
    if (data.entityType && data.entityType !== "all") query = query.eq("entity_type", data.entityType);

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return { logs: (rows ?? []) as unknown as ActivityLog[] };
  });

/** Platform-wide AI control centre data. Admin only — enforced by has_role. */
export const getAdminAiOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden: admin access is required.");

    const [assistants, chatbots, voice, workflows, executions, usage, logs] = await Promise.all([
      supabase.from("ai_assistants").select("id, status, user_id, name, created_at"),
      supabase.from("chatbots").select("id, status"),
      supabase.from("voice_agents").select("id, status, total_calls, successful_calls, missed_calls"),
      supabase.from("workflows").select("id, is_active, run_count, name"),
      supabase
        .from("workflow_executions")
        .select("id, workflow_id, status, error, started_at, duration_ms")
        .order("started_at", { ascending: false })
        .limit(50),
      supabase.from("ai_usage").select("ai_requests, chat_messages, voice_calls, workflow_executions, input_tokens, output_tokens"),
      supabase
        .from("automation_activity_logs")
        .select(LOG_COLUMNS)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    const usageRows = usage.data ?? [];
    const execRows = executions.data ?? [];

    return {
      totals: {
        assistants: assistants.data?.length ?? 0,
        activeChatbots: (chatbots.data ?? []).filter((c) => c.status === "Active").length,
        chatbots: chatbots.data?.length ?? 0,
        voiceAgents: voice.data?.length ?? 0,
        workflows: workflows.data?.length ?? 0,
        workflowExecutions: execRows.length,
        failedExecutions: execRows.filter((e) => e.status === "Failed").length,
        aiRequests: usageRows.reduce((s, r) => s + (r.ai_requests ?? 0), 0),
        chatMessages: usageRows.reduce((s, r) => s + (r.chat_messages ?? 0), 0),
        voiceCalls: usageRows.reduce((s, r) => s + (r.voice_calls ?? 0), 0),
        tokens: usageRows.reduce((s, r) => s + (r.input_tokens ?? 0) + (r.output_tokens ?? 0), 0),
      },
      executions: execRows,
      workflows: workflows.data ?? [],
      logs: (logs.data ?? []) as unknown as ActivityLog[],
    };
  });
