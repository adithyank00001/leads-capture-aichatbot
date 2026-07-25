import { apiError, apiSuccess } from "@/lib/api-response";
import { requireLead } from "@/lib/api/handlers/leads";
import { handleRouteError } from "@/lib/api/request";
import { getChatRetentionCutoffDate } from "@/lib/chat/retention";
import { getMessagesForDisplay } from "@/lib/db/messages";
import { getBusinessContext } from "@/lib/business/context";
import { ApiValidationError } from "@/lib/validation/errors";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const botId = searchParams.get("botId")?.trim();
  const sessionId = searchParams.get("sessionId")?.trim();

  try {
    if (!botId) {
      throw new ApiValidationError("MISSING_BOTID", "botId is required.");
    }

    if (!sessionId) {
      throw new ApiValidationError("MISSING_SESSIONID", "sessionId is required.");
    }

    await getBusinessContext(botId);
    await requireLead(botId, sessionId);

    const messages = await getMessagesForDisplay(
      botId,
      sessionId,
      getChatRetentionCutoffDate(),
    );

    return apiSuccess({ messages });
  } catch (error) {
    const routeError = handleRouteError(error, {
      isPublicApi: true,
      route: "/api/v1/messages",
      botId: botId ?? undefined,
      sessionId: sessionId ?? undefined,
    });
    return apiError(
      routeError.code,
      routeError.message,
      routeError.status,
      routeError.errorId,
    );
  }
}
