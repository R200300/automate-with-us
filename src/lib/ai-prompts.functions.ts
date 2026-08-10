import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const PROMPT_CATEGORIES = [
  "Sales",
  "Customer Support",
  "Marketing",
  "Lead Generation",
  "Operations",
  "General",
] as const;

export type PromptCategory = (typeof PROMPT_CATEGORIES)[number];

export type AiPrompt = {
  id: string;
  title: string;
  category: PromptCategory;
  body: string;
  variables: string[];
  description: string | null;
  is_favorite: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

const COLUMNS =
  "id, title, category, body, variables, description, is_favorite, created_by, created_at, updated_at";

function normalize(row: Record<string, unknown>): AiPrompt {
  const raw = row["variables"];
  return {
    ...(row as unknown as AiPrompt),
    variables: Array.isArray(raw) ? (raw as string[]) : [],
  };
}

export const listPrompts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("prompts")
      .select(COLUMNS)
      .order("is_favorite", { ascending: false })
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { prompts: (data ?? []).map((r) => normalize(r as Record<string, unknown>)) };
  });

const promptSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(2).max(160),
  category: z.enum(PROMPT_CATEGORIES),
  body: z.string().trim().min(1).max(8000),
  description: z.string().trim().max(600).optional().nullable(),
  variables: z.array(z.string().trim().min(1).max(60)).max(25).optional(),
});

export const savePrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => promptSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { logAutomationEvent } = await import("@/lib/ai-hub.server");
    const payload = {
      title: data.title,
      category: data.category,
      body: data.body,
      description: data.description ?? null,
      variables: (data.variables ?? []) as never,
    };

    if (data.id) {
      const { data: row, error } = await context.supabase
        .from("prompts")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", data.id)
        .select(COLUMNS)
        .maybeSingle();
      if (error) throw new Error(error.message);
      await logAutomationEvent({
        userId: context.userId,
        eventType: "Prompt Updated",
        entityType: "prompt",
        entityId: data.id,
        message: `Prompt "${data.title}" updated`,
      });
      return normalize((row ?? {}) as Record<string, unknown>);
    }

    const { data: row, error } = await context.supabase
      .from("prompts")
      .insert({ ...payload, user_id: context.userId, created_by: context.userId })
      .select(COLUMNS)
      .maybeSingle();
    if (error) throw new Error(error.message);
    await logAutomationEvent({
      userId: context.userId,
      eventType: "Prompt Created",
      entityType: "prompt",
      entityId: row?.id ?? null,
      message: `Prompt "${data.title}" created`,
    });
    return normalize((row ?? {}) as Record<string, unknown>);
  });

export const duplicatePrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: source, error } = await context.supabase
      .from("prompts")
      .select(COLUMNS)
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!source) throw new Error("Prompt not found.");

    const { data: row, error: insertError } = await context.supabase
      .from("prompts")
      .insert({
        title: `${source.title} (copy)`,
        category: source.category,
        body: source.body,
        description: source.description,
        variables: source.variables as never,
        user_id: context.userId,
        created_by: context.userId,
      })
      .select(COLUMNS)
      .maybeSingle();
    if (insertError) throw new Error(insertError.message);
    return normalize((row ?? {}) as Record<string, unknown>);
  });

export const togglePromptFavorite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; isFavorite: boolean }) =>
    z.object({ id: z.string().uuid(), isFavorite: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("prompts")
      .update({ is_favorite: data.isFavorite })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deletePrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { logAutomationEvent } = await import("@/lib/ai-hub.server");
    const { error } = await context.supabase.from("prompts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await logAutomationEvent({
      userId: context.userId,
      eventType: "Prompt Deleted",
      entityType: "prompt",
      entityId: data.id,
      message: "Prompt deleted",
      level: "warning",
    });
    return { ok: true };
  });

const testSchema = z.object({
  body: z.string().trim().min(1).max(8000),
  values: z.record(z.string(), z.string().max(2000)).optional(),
});

/** Renders {{variables}} into the prompt and runs it through the AI gateway. */
export const testPrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => testSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { callAiGateway, AiGatewayError } = await import("@/lib/ai-gateway.server");
    const { bumpUsage, logAutomationEvent } = await import("@/lib/ai-hub.server");

    let rendered = data.body;
    for (const [key, value] of Object.entries(data.values ?? {})) {
      rendered = rendered.replaceAll(`{{${key}}}`, value);
    }

    try {
      const result = await callAiGateway({ messages: [{ role: "user", content: rendered }] });
      await bumpUsage(context.userId, {
        ai_requests: 1,
        input_tokens: result.inputTokens,
        output_tokens: result.outputTokens,
      });
      await logAutomationEvent({
        userId: context.userId,
        eventType: "AI Request",
        entityType: "prompt",
        message: "Prompt tested against the AI gateway",
        metadata: { model: result.model, tokens: result.inputTokens + result.outputTokens },
      });
      return { text: result.text, rendered, model: result.model };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      await logAutomationEvent({
        userId: context.userId,
        eventType: "AI Error",
        entityType: "prompt",
        message: `Prompt test failed: ${message}`,
        level: "error",
      });
      throw new Error(
        error instanceof AiGatewayError ? error.userMessage : "The prompt test failed. Please retry.",
      );
    }
  });
