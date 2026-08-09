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

function getChatModelChain(models?: string[]) {
  const chain =
    models ??
    [serverEnv.openRouterModel, serverEnv.openRouterFallbackModel];

  return chain.filter(
    (model, index, modelList) => modelList.indexOf(model) === index,
  );
}

function shouldTryFallbackModel(error: unknown) {
  if (!(error instanceof ApiValidationError)) {
    return false;
  }

  return (
    error.code === "AI_PROVIDER_ERROR" ||
    error.code === "AI_INVALID_RESPONSE" ||
    error.code === "AI_EMPTY_RESPONSE"
  );
}

async function requestChatCompletion(
  model: string,
  messages: AiChatMessage[],
) {
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serverEnv.openRouterApiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": serverEnv.appUrl,
      "X-Title": publicConfig.appName,
    },
    body: JSON.stringify({
      model,
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

export type GenerateChatCompletionOptions = {
  models?: string[];
};

export async function generateChatCompletion(
  messages: AiChatMessage[],
  options?: GenerateChatCompletionOptions,
) {
  if (!serverEnv.openRouterApiKey) {
    throw new ApiValidationError(
      "AI_NOT_CONFIGURED",
      "AI provider is not configured on the server.",
      500,
    );
  }

  const models = getChatModelChain(options?.models);
  let lastError: ApiValidationError | null = null;

  for (let index = 0; index < models.length; index += 1) {
    const model = models[index];
    const isLastModel = index === models.length - 1;

    try {
      return await requestChatCompletion(model, messages);
    } catch (error) {
      if (!isLastModel && shouldTryFallbackModel(error)) {
        lastError =
          error instanceof ApiValidationError
            ? error
            : new ApiValidationError(
                "AI_PROVIDER_ERROR",
                "AI provider request failed.",
                502,
              );
        continue;
      }

      throw error;
    }
  }

  throw (
    lastError ??
    new ApiValidationError(
      "AI_PROVIDER_ERROR",
      "AI provider request failed.",
      502,
    )
  );
}
