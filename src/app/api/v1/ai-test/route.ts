import { apiError, apiSuccess } from "@/lib/api-response";
import { buildAiMessages } from "@/lib/ai/conversation";
import { generateChatCompletion } from "@/lib/ai/openrouter";
import { getBusinessContext } from "@/lib/business/context";
import { publicConfig } from "@/lib/config";
import { handleRouteError, parseJsonBody } from "@/lib/api/request";
import { ApiValidationError } from "@/lib/validation/errors";

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return apiError(
      "NOT_ALLOWED",
      "AI test route is disabled in production.",
      404,
    );
  }

  try {
    const body = await parseJsonBody(request);
    const payload =
      body && typeof body === "object" && !Array.isArray(body)
        ? (body as Record<string, unknown>)
        : {};

    const botId =
      typeof payload.botId === "string" && payload.botId.trim()
        ? payload.botId.trim()
        : publicConfig.defaultBotId;

    const message =
      typeof payload.message === "string" && payload.message.trim()
        ? payload.message.trim()
        : null;

    if (!message) {
      throw new ApiValidationError("MISSING_MESSAGE", "message is required.");
    }

    await getBusinessContext(botId);

    const aiMessages = await buildAiMessages(botId, [
      { role: "user", content: message },
    ]);

    const answer = await generateChatCompletion(aiMessages);

    return apiSuccess({
      botId,
      question: message,
      answer,
    });
  } catch (error) {
    const routeError = handleRouteError(error);
    return apiError(routeError.code, routeError.message, routeError.status);
  }
}
