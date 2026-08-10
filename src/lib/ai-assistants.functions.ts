import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const AI_STATUSES = ["Draft", "Active", "Inactive", "Archived"] as const;
export const AI_TONES = [
  "Professional",
  "Friendly",
  "Concise",
  "Enthusiastic",
  "Empathetic",
  "Formal",
] as const;
export const AI_LANGUAGES = [
  "English",
  "Hindi",
  "Spanish",
  "French",
  "German",
  "Portuguese",
] as const;
export const AI_VOICES = ["Aria", "Atlas", "Nova", "Orion", "Sage", "Vale"] as const;

export type AiStatus = (typeof AI_STATUSES)[number];

const ASSISTANT_COLUMNS =
  "id, user_id, project_id, knowledge_base_id, name, description, system_instructions, tone, language, objective, fallback_behavior, model, status, created_at, updated_at";

export type AiAssistant = {
  id: string;
  user_id: string;
  project_id: string | null;
  knowledge_base_id: string | null;
  name: string;
  description: string | null;
  system_instructions: string;
  tone: string;
  language: string;
  objective: string | null;
  fallback_behavior: string | null;
  model: string;
  status: AiStatus;
  created_at: string;
  updated_at: string;
};

export const listAssistants = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [assistants, bases, projects] = await Promise.all([
      context.supabase.from("ai_assistants").select(ASSISTANT_COLUMNS).order("created_at", { ascending: false }),
      context.supabase.from("knowledge_bases").select("id, name").order("name"),
      context.supabase.from("projects").select("id, name").order("created_at", { ascending: false }),
    ]);
    if (assistants.error) throw new Error(assistants.error.message);

    return {
      assistants: (assistants.data ?? []) as AiAssistant[],
      knowledgeBases: (bases.data ?? []) as Array<{ id: string; name: string }>,
      projects: (projects.data ?? []) as Array<{ id: string; name: string }>,
    };
  });

const assistantSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(600).optional().nullable(),
  systemInstructions: z.string().trim().max(6000),
  tone: z.string().trim().min(1).max(60),
  language: z.string().trim().min(1).max(60),
  objective: z.string().trim().max(400).optional().nullable(),
  fallbackBehavior: z.string().trim().max(600).optional().nullable(),
  projectId: z.string().uuid().nullable().optional(),
  knowledgeBaseId: z.string().uuid().nullable().optional(),
  status: z.enum(AI_STATUSES).optional(),
});

export const saveAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => assistantSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { logAutomationEvent } = await import("@/lib/ai-hub.server");
    const payload = {
      name: data.name,
      description: data.description ?? null,
      system_instructions: data.systemInstructions,
      tone: data.tone,
      language: data.language,
      objective: data.objective ?? null,
      fallback_behavior: data.fallbackBehavior ?? null,
      project_id: data.projectId ?? null,
      knowledge_base_id: data.knowledgeBaseId ?? null,
      ...(data.status ? { status: data.status } : {}),
    };

    if (data.id) {
      const { data: row, error } = await context.supabase
        .from("ai_assistants")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", data.id)
        .select(ASSISTANT_COLUMNS)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!row) throw new Error("Assistant not found.");
      await logAutomationEvent({
        userId: context.userId,
        eventType: "Assistant Updated",
        entityType: "assistant",
        entityId: row.id,
        message: `Assistant "${row.name}" updated`,
      });
      return row as AiAssistant;
    }

    const { data: row, error } = await context.supabase
      .from("ai_assistants")
      .insert({ ...payload, user_id: context.userId, created_by: context.userId })
      .select(ASSISTANT_COLUMNS)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Could not create the assistant.");
    await logAutomationEvent({
      userId: context.userId,
      eventType: "Assistant Created",
      entityType: "assistant",
      entityId: row.id,
      message: `Assistant "${row.name}" created`,
    });
    return row as AiAssistant;
  });

export const duplicateAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { logAutomationEvent } = await import("@/lib/ai-hub.server");
    const { data: source, error } = await context.supabase
      .from("ai_assistants")
      .select(ASSISTANT_COLUMNS)
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!source) throw new Error("Assistant not found.");

    const { id: _id, created_at: _c, updated_at: _u, user_id: _uid, ...rest } = source as AiAssistant;
    const { data: row, error: insertError } = await context.supabase
      .from("ai_assistants")
      .insert({
        ...rest,
        name: `${source.name} (copy)`,
        status: "Draft",
        user_id: context.userId,
        created_by: context.userId,
      })
      .select(ASSISTANT_COLUMNS)
      .maybeSingle();
    if (insertError) throw new Error(insertError.message);
    await logAutomationEvent({
      userId: context.userId,
      eventType: "Assistant Created",
      entityType: "assistant",
      entityId: row?.id ?? null,
      message: `Assistant "${source.name}" duplicated`,
    });
    return row as AiAssistant;
  });

export const setAssistantStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; status: AiStatus }) =>
    z.object({ id: z.string().uuid(), status: z.enum(AI_STATUSES) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { logAutomationEvent } = await import("@/lib/ai-hub.server");
    const { error } = await context.supabase
      .from("ai_assistants")
      .update({ status: data.status, updated_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await logAutomationEvent({
      userId: context.userId,
      eventType: "Assistant Updated",
      entityType: "assistant",
      entityId: data.id,
      message: `Assistant status changed to ${data.status}`,
    });
    return { ok: true };
  });

export const deleteAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { logAutomationEvent } = await import("@/lib/ai-hub.server");
    const { error } = await context.supabase.from("ai_assistants").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await logAutomationEvent({
      userId: context.userId,
      eventType: "Assistant Deleted",
      entityType: "assistant",
      entityId: data.id,
      message: "Assistant deleted",
      level: "warning",
    });
    return { ok: true };
  });

/* ------------------------------- Chatbots -------------------------------- */

const CHATBOT_COLUMNS =
  "id, user_id, assistant_id, knowledge_base_id, name, welcome_message, system_prompt, tone, language, business_info, contact_info, working_hours, fallback_message, model, status, created_at, updated_at";

export type AiChatbot = {
  id: string;
  user_id: string;
  assistant_id: string | null;
  knowledge_base_id: string | null;
  name: string;
  welcome_message: string;
  system_prompt: string;
  tone: string;
  language: string;
  business_info: string | null;
  contact_info: string | null;
  working_hours: string | null;
  fallback_message: string;
  model: string;
  status: AiStatus;
  created_at: string;
  updated_at: string;
};

export const listChatbots = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [bots, bases, assistants] = await Promise.all([
      context.supabase.from("chatbots").select(CHATBOT_COLUMNS).order("created_at", { ascending: false }),
      context.supabase.from("knowledge_bases").select("id, name").order("name"),
      context.supabase.from("ai_assistants").select("id, name").order("name"),
    ]);
    if (bots.error) throw new Error(bots.error.message);
    return {
      chatbots: (bots.data ?? []) as AiChatbot[],
      knowledgeBases: (bases.data ?? []) as Array<{ id: string; name: string }>,
      assistants: (assistants.data ?? []) as Array<{ id: string; name: string }>,
    };
  });

const chatbotSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(120),
  welcomeMessage: z.string().trim().min(1).max(600),
  systemPrompt: z.string().trim().max(6000),
  tone: z.string().trim().min(1).max(60),
  language: z.string().trim().min(1).max(60),
  businessInfo: z.string().trim().max(3000).optional().nullable(),
  contactInfo: z.string().trim().max(1000).optional().nullable(),
  workingHours: z.string().trim().max(400).optional().nullable(),
  fallbackMessage: z.string().trim().min(1).max(600),
  assistantId: z.string().uuid().nullable().optional(),
  knowledgeBaseId: z.string().uuid().nullable().optional(),
  status: z.enum(AI_STATUSES).optional(),
});

export const saveChatbot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => chatbotSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { logAutomationEvent } = await import("@/lib/ai-hub.server");
    const payload = {
      name: data.name,
      welcome_message: data.welcomeMessage,
      system_prompt: data.systemPrompt,
      tone: data.tone,
      language: data.language,
      business_info: data.businessInfo ?? null,
      contact_info: data.contactInfo ?? null,
      working_hours: data.workingHours ?? null,
      fallback_message: data.fallbackMessage,
      assistant_id: data.assistantId ?? null,
      knowledge_base_id: data.knowledgeBaseId ?? null,
      ...(data.status ? { status: data.status } : {}),
    };

    if (data.id) {
      const { data: row, error } = await context.supabase
        .from("chatbots")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", data.id)
        .select(CHATBOT_COLUMNS)
        .maybeSingle();
      if (error) throw new Error(error.message);
      await logAutomationEvent({
        userId: context.userId,
        eventType: "Chatbot Updated",
        entityType: "chatbot",
        entityId: data.id,
        message: `Chatbot "${data.name}" updated`,
      });
      return row as AiChatbot;
    }

    const { data: row, error } = await context.supabase
      .from("chatbots")
      .insert({ ...payload, user_id: context.userId, created_by: context.userId })
      .select(CHATBOT_COLUMNS)
      .maybeSingle();
    if (error) throw new Error(error.message);
    await logAutomationEvent({
      userId: context.userId,
      eventType: "Chatbot Created",
      entityType: "chatbot",
      entityId: row?.id ?? null,
      message: `Chatbot "${data.name}" created`,
    });
    return row as AiChatbot;
  });

export const setChatbotStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; status: AiStatus }) =>
    z.object({ id: z.string().uuid(), status: z.enum(AI_STATUSES) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { logAutomationEvent } = await import("@/lib/ai-hub.server");
    const { error } = await context.supabase
      .from("chatbots")
      .update({ status: data.status, updated_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await logAutomationEvent({
      userId: context.userId,
      eventType: "Chatbot Updated",
      entityType: "chatbot",
      entityId: data.id,
      message: `Chatbot status changed to ${data.status}`,
    });
    return { ok: true };
  });

export const deleteChatbot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { logAutomationEvent } = await import("@/lib/ai-hub.server");
    const { error } = await context.supabase.from("chatbots").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await logAutomationEvent({
      userId: context.userId,
      eventType: "Chatbot Deleted",
      entityType: "chatbot",
      entityId: data.id,
      message: "Chatbot deleted",
      level: "warning",
    });
    return { ok: true };
  });

/* ----------------------------- Voice agents ------------------------------ */

const VOICE_COLUMNS =
  "id, user_id, assistant_id, name, business_name, voice, language, system_instructions, greeting, fallback_message, business_hours, call_objective, provider, status, total_calls, successful_calls, missed_calls, total_call_seconds, created_at, updated_at";

export type AiVoiceAgent = {
  id: string;
  user_id: string;
  assistant_id: string | null;
  name: string;
  business_name: string | null;
  voice: string;
  language: string;
  system_instructions: string;
  greeting: string | null;
  fallback_message: string | null;
  business_hours: string | null;
  call_objective: string | null;
  provider: string | null;
  status: AiStatus;
  total_calls: number;
  successful_calls: number;
  missed_calls: number;
  total_call_seconds: number;
  created_at: string;
  updated_at: string;
};

export const listVoiceAgents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [agents, assistants] = await Promise.all([
      context.supabase.from("voice_agents").select(VOICE_COLUMNS).order("created_at", { ascending: false }),
      context.supabase.from("ai_assistants").select("id, name").order("name"),
    ]);
    if (agents.error) throw new Error(agents.error.message);
    return {
      agents: (agents.data ?? []) as AiVoiceAgent[],
      assistants: (assistants.data ?? []) as Array<{ id: string; name: string }>,
    };
  });

const voiceSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(120),
  businessName: z.string().trim().max(160).optional().nullable(),
  voice: z.string().trim().min(1).max(60),
  language: z.string().trim().min(1).max(60),
  systemInstructions: z.string().trim().max(6000),
  greeting: z.string().trim().max(600).optional().nullable(),
  fallbackMessage: z.string().trim().max(600).optional().nullable(),
  businessHours: z.string().trim().max(400).optional().nullable(),
  callObjective: z.string().trim().max(400).optional().nullable(),
  assistantId: z.string().uuid().nullable().optional(),
  status: z.enum(AI_STATUSES).optional(),
});

export const saveVoiceAgent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => voiceSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { logAutomationEvent } = await import("@/lib/ai-hub.server");
    const payload = {
      name: data.name,
      business_name: data.businessName ?? null,
      voice: data.voice,
      language: data.language,
      system_instructions: data.systemInstructions,
      greeting: data.greeting ?? null,
      fallback_message: data.fallbackMessage ?? null,
      business_hours: data.businessHours ?? null,
      call_objective: data.callObjective ?? null,
      assistant_id: data.assistantId ?? null,
      ...(data.status ? { status: data.status } : {}),
    };

    if (data.id) {
      const { data: row, error } = await context.supabase
        .from("voice_agents")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", data.id)
        .select(VOICE_COLUMNS)
        .maybeSingle();
      if (error) throw new Error(error.message);
      await logAutomationEvent({
        userId: context.userId,
        eventType: "Voice Agent Updated",
        entityType: "voice_agent",
        entityId: data.id,
        message: `Voice agent "${data.name}" updated`,
      });
      return row as AiVoiceAgent;
    }

    const { data: row, error } = await context.supabase
      .from("voice_agents")
      .insert({ ...payload, user_id: context.userId, created_by: context.userId })
      .select(VOICE_COLUMNS)
      .maybeSingle();
    if (error) throw new Error(error.message);
    await logAutomationEvent({
      userId: context.userId,
      eventType: "Voice Agent Updated",
      entityType: "voice_agent",
      entityId: row?.id ?? null,
      message: `Voice agent "${data.name}" created`,
    });
    return row as AiVoiceAgent;
  });

export const deleteVoiceAgent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { logAutomationEvent } = await import("@/lib/ai-hub.server");
    const { error } = await context.supabase.from("voice_agents").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await logAutomationEvent({
      userId: context.userId,
      eventType: "Voice Agent Updated",
      entityType: "voice_agent",
      entityId: data.id,
      message: "Voice agent deleted",
      level: "warning",
    });
    return { ok: true };
  });

export const setVoiceAgentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; status: AiStatus }) =>
    z.object({ id: z.string().uuid(), status: z.enum(AI_STATUSES) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { logAutomationEvent } = await import("@/lib/ai-hub.server");
    const { error } = await context.supabase
      .from("voice_agents")
      .update({ status: data.status, updated_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await logAutomationEvent({
      userId: context.userId,
      eventType: "Voice Agent Updated",
      entityType: "voice_agent",
      entityId: data.id,
      message: `Voice agent status changed to ${data.status}`,
    });
    return { ok: true };
  });
