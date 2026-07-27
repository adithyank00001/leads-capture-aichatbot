import { publicConfig } from "@/lib/config";
import { serverEnv } from "@/lib/env.server";
import { ApiValidationError } from "@/lib/validation/errors";

const OPENROUTER_EMBEDDINGS_URL = "https://openrouter.ai/api/v1/embeddings";

type OpenRouterEmbeddingsResponse = {
  data?: Array<{
    embedding?: number[];
  }>;
  error?: {
    message?: string;
  };
};

export async function createEmbedding(text: string): Promise<number[]> {
  if (!serverEnv.openRouterApiKey) {
    throw new ApiValidationError(
      "AI_NOT_CONFIGURED",
      "AI provider is not configured on the server.",
      500,
    );
  }

  const response = await fetch(OPENROUTER_EMBEDDINGS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serverEnv.openRouterApiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": serverEnv.appUrl,
      "X-Title": publicConfig.appName,
    },
    body: JSON.stringify({
      model: serverEnv.openRouterEmbeddingModel,
      input: text,
      dimensions: serverEnv.embeddingDimensions,
    }),
  });

  let payload: OpenRouterEmbeddingsResponse;

  try {
    payload = (await response.json()) as OpenRouterEmbeddingsResponse;
  } catch {
    throw new ApiValidationError(
      "AI_INVALID_RESPONSE",
      "Embedding provider returned an invalid response.",
      502,
    );
  }

  if (!response.ok) {
    throw new ApiValidationError(
      "AI_PROVIDER_ERROR",
      payload.error?.message ?? "Embedding provider request failed.",
      502,
    );
  }

  const embedding = payload.data?.[0]?.embedding;

  if (!embedding || embedding.length === 0) {
    throw new ApiValidationError(
      "AI_EMPTY_RESPONSE",
      "Embedding provider returned an empty vector.",
      502,
    );
  }

  return embedding;
}

export function formatEmbeddingForPostgres(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}
