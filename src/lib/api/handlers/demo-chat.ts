import type { AiChatMessage } from "@/lib/ai/openrouter";
import { generateChatCompletion } from "@/lib/ai/openrouter";
import { AI_HISTORY_LIMIT } from "@/lib/demo/constants";
import { getDemoSystemPrompt } from "@/lib/demo/prompt";
import { serverEnv } from "@/lib/env.server";
import { assertDemoRateLimits } from "@/lib/rate-limit";
import { ApiValidationError } from "@/lib/validation/errors";
import { parseDemoChatPayload } from "@/lib/validation/demo-requests";

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new ApiValidationError(
          "AI_TIMEOUT",
          "Something took longer than expected.",
          504,
        ),
      );
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

export async function sendDemoChatMessage(body: unknown, request: Request) {
  const input = parseDemoChatPayload(body);

  await assertDemoRateLimits(request, input.sessionId);

  const recentHistory = input.history.slice(-AI_HISTORY_LIMIT);
  const systemPrompt = getDemoSystemPrompt();

  const aiMessages: AiChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...recentHistory.map((item) => ({
      role: item.role as "user" | "assistant",
      content: item.content,
    })),
    { role: "user", content: input.message },
  ];

  const answer = await withTimeout(
    generateChatCompletion(aiMessages, {
      models: [
        serverEnv.demoOpenRouterModel,
        serverEnv.demoOpenRouterFallbackModel,
      ],
    }),
    serverEnv.demoAiTimeoutMs,
  );

  return {
    answer,
    aiConnected: true,
  };
}
