import { apiError, apiSuccess } from "@/lib/api-response";
import { sendDemoChatMessage } from "@/lib/api/handlers/demo-chat";
import { handleRouteError, parseJsonBody } from "@/lib/api/request";

export async function POST(request: Request) {
  let sessionId: string | undefined;

  try {
    const body = await parseJsonBody(request);

    if (
      body &&
      typeof body === "object" &&
      !Array.isArray(body) &&
      typeof (body as Record<string, unknown>).sessionId === "string"
    ) {
      sessionId = (body as Record<string, unknown>).sessionId as string;
    }

    const result = await sendDemoChatMessage(body, request);

    return apiSuccess(result);
  } catch (error) {
    const routeError = handleRouteError(error, {
      isPublicApi: true,
      route: "/api/v1/demo-chat",
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
