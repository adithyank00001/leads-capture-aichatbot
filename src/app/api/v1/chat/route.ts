import { apiError, apiSuccess } from "@/lib/api-response";
import { sendChatMessage } from "@/lib/api/handlers/chat";
import { handleRouteError, parseJsonBody } from "@/lib/api/request";
import { parseChatPayload } from "@/lib/validation/requests";

export async function POST(request: Request) {
  let botId: string | undefined;
  let sessionId: string | undefined;

  try {
    const body = await parseJsonBody(request);

    try {
      const parsed = parseChatPayload(body);
      botId = parsed.botId;
      sessionId = parsed.sessionId;
    } catch {
      // Validation errors are handled below when sendChatMessage runs.
    }

    const result = await sendChatMessage(body, request);

    return apiSuccess(result);
  } catch (error) {
    const routeError = handleRouteError(error, {
      isPublicApi: true,
      route: "/api/v1/chat",
      botId,
      sessionId,
    });
    return apiError(
      routeError.code,
      routeError.message,
      routeError.status,
      routeError.errorId,
    );
  }
}
