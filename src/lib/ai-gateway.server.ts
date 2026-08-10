/**
 * Server-only wrapper around the Lovable AI Gateway.
 * The API key never leaves the server: this module is only imported from
 * server function handlers.
 */

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export const DEFAULT_AI_MODEL = "google/gemini-3-flash-preview";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type AiGatewayResult = {
  text: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
};

export class AiGatewayError extends Error {
  status: number;
  userMessage: string;
  retryable: boolean;

  constructor(status: number, message: string) {
    super(message);
    this.name = "AiGatewayError";
    this.status = status;
    this.retryable = status === 429 || status >= 500;
    this.userMessage =
      status === 429
        ? "The AI service is busy right now. Please wait a moment and try again."
        : status === 402
          ? "AI credits are exhausted for this workspace. Add credits to continue."
          : status >= 500
            ? "The AI provider had a temporary problem. Please retry."
            : "The AI request could not be completed. Please check your configuration and try again.";
  }
}

/** Calls the gateway and returns the assistant text plus token usage. */
export async function callAiGateway(params: {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
}): Promise<AiGatewayResult> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) {
    throw new AiGatewayError(500, "LOVABLE_API_KEY is not configured on the server.");
  }

  const model = params.model?.trim() || DEFAULT_AI_MODEL;

  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model,
      messages: params.messages,
      ...(params.temperature !== undefined ? { temperature: params.temperature } : {}),
      ...(params.maxOutputTokens ? { max_tokens: params.maxOutputTokens } : {}),
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new AiGatewayError(response.status, body.slice(0, 500) || response.statusText);
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };

  const text = json.choices?.[0]?.message?.content?.trim() ?? "";

  return {
    text,
    model,
    inputTokens: json.usage?.prompt_tokens ?? 0,
    outputTokens: json.usage?.completion_tokens ?? 0,
  };
}
