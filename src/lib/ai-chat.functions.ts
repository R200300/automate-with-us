import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MAX_KB_CHARS = 12_000;

const chatSchema = z.object({
  target: z.enum(["assistant", "chatbot"]),
  id: z.string().uuid(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(4000),
      }),
    )
    .min(1)
    .max(30),
});

/**
 * Runs a real AI request for an assistant or chatbot. The provider key stays
 * server-side; knowledge base text is injected as grounding context.
 */
export const runAiChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => chatSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { callAiGateway, AiGatewayError } = await import("@/lib/ai-gateway.server");
    const { bumpUsage, logAutomationEvent } = await import("@/lib/ai-hub.server");
    const { supabase, userId } = context;

    let systemPrompt = "";
    let knowledgeBaseId: string | null = null;
    let model: string | undefined;
    let fallback = "I'm not sure about that yet. A human specialist will follow up with you.";
    let entityName = "";

    if (data.target === "assistant") {
      const { data: row, error } = await supabase
        .from("ai_assistants")
        .select(
          "id, name, system_instructions, tone, language, objective, fallback_behavior, model, knowledge_base_id",
        )
        .eq("id", data.id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!row) throw new Error("Assistant not found.");
      entityName = row.name;
      knowledgeBaseId = row.knowledge_base_id;
      model = row.model;
      fallback = row.fallback_behavior || fallback;
      systemPrompt = [
        `You are "${row.name}", an AI assistant.`,
        row.system_instructions,
        `Tone: ${row.tone}. Reply in ${row.language}.`,
        row.objective ? `Primary objective: ${row.objective}` : "",
        `If you do not know the answer, respond with: ${fallback}`,
      ]
        .filter(Boolean)
        .join("\n\n");
    } else {
      const { data: row, error } = await supabase
        .from("chatbots")
        .select(
          "id, name, system_prompt, tone, language, business_info, contact_info, working_hours, fallback_message, model, knowledge_base_id",
        )
        .eq("id", data.id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!row) throw new Error("Chatbot not found.");
      entityName = row.name;
      knowledgeBaseId = row.knowledge_base_id;
      model = row.model;
      fallback = row.fallback_message || fallback;
      systemPrompt = [
        `You are "${row.name}", a customer-facing chatbot.`,
        row.system_prompt,
        `Tone: ${row.tone}. Reply in ${row.language}.`,
        row.business_info ? `Business information:\n${row.business_info}` : "",
        row.contact_info ? `Contact details:\n${row.contact_info}` : "",
        row.working_hours ? `Working hours: ${row.working_hours}` : "",
        `If the answer is not in your information, respond with: ${fallback}`,
      ]
        .filter(Boolean)
        .join("\n\n");
    }

    let knowledgeUsed = 0;
    if (knowledgeBaseId) {
      const { data: docs } = await supabase
        .from("knowledge_documents")
        .select("name, content")
        .eq("knowledge_base_id", knowledgeBaseId)
        .eq("processing_status", "Ready")
        .limit(20);

      const chunks: string[] = [];
      let used = 0;
      for (const doc of docs ?? []) {
        if (!doc.content) continue;
        const remaining = MAX_KB_CHARS - used;
        if (remaining <= 0) break;
        const slice = doc.content.slice(0, remaining);
        used += slice.length;
        knowledgeUsed += 1;
        chunks.push(`### ${doc.name}\n${slice}`);
      }
      if (chunks.length > 0) {
        systemPrompt += `\n\nUse the following knowledge base content as your source of truth:\n\n${chunks.join("\n\n")}`;
      }
    }

    try {
      const result = await callAiGateway({
        model: model ?? undefined,
        messages: [{ role: "system" as const, content: systemPrompt }, ...data.messages],
      });

      await bumpUsage(userId, {
        ai_requests: 1,
        chat_messages: 1,
        input_tokens: result.inputTokens,
        output_tokens: result.outputTokens,
      });
      await logAutomationEvent({
        userId,
        eventType: "AI Request",
        entityType: data.target,
        entityId: data.id,
        message: `Test conversation with "${entityName}"`,
        metadata: {
          model: result.model,
          knowledge_documents_used: knowledgeUsed,
          tokens: result.inputTokens + result.outputTokens,
        },
      });

      return {
        text: result.text || fallback,
        model: result.model,
        knowledgeDocumentsUsed: knowledgeUsed,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      await logAutomationEvent({
        userId,
        eventType: "AI Error",
        entityType: data.target,
        entityId: data.id,
        message: `AI request failed: ${message}`,
        level: "error",
      });
      throw new Error(
        error instanceof AiGatewayError
          ? error.userMessage
          : "The AI request failed. Your configuration was not changed — please retry.",
      );
    }
  });
