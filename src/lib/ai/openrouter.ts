import { publicConfig } from "@/lib/config";
import { serverEnv } from "@/lib/env.server";
import { ApiValidationError } from "@/lib/validation/errors";

export type AiChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  error?: {
    message?: string;
  };
};

export async function generateChatCompletion(messages: AiChatMessage[]) {
  if (!serverEnv.openRouterApiKey) {
    throw new ApiValidationError(
      "AI_NOT_CONFIGURED",
      "AI provider is not configured on the server.",
      500,
    );
  }

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serverEnv.openRouterApiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": serverEnv.appUrl,
      "X-Title": publicConfig.appName,
    },
    body: JSON.stringify({
      model: serverEnv.openRouterModel,
      messages,
      temperature: 0.3,
      max_tokens: 500,
    }),
  });

  let payload: OpenRouterResponse;

  try {
    payload = (await response.json()) as OpenRouterResponse;
  } catch {
    throw new ApiValidationError(
      "AI_INVALID_RESPONSE",
      "AI provider returned an invalid response.",
      502,
    );
  }

  if (!response.ok) {
    throw new ApiValidationError(
      "AI_PROVIDER_ERROR",
      payload.error?.message ?? "AI provider request failed.",
      502,
    );
  }

  const answer = payload.choices?.[0]?.message?.content?.trim();

  if (!answer) {
    throw new ApiValidationError(
      "AI_EMPTY_RESPONSE",
      "AI provider returned an empty answer.",
      502,
    );
  }

  return answer;
}
