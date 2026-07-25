import { apiError, apiSuccess } from "@/lib/api-response";
import { captureLead } from "@/lib/api/handlers/leads";
import { handleRouteError, parseJsonBody } from "@/lib/api/request";
import { parseLeadPayload } from "@/lib/validation/requests";

export async function POST(request: Request) {
  let botId: string | undefined;
  let sessionId: string | undefined;

  try {
    const body = await parseJsonBody(request);

    try {
      const parsed = parseLeadPayload(body);
      botId = parsed.botId;
      sessionId = parsed.sessionId;
    } catch {
      // Validation errors are handled when captureLead runs.
    }

    const result = await captureLead(body, request);

    return apiSuccess(result, result.created ? 201 : 200);
  } catch (error) {
    const routeError = handleRouteError(error, {
      isPublicApi: true,
      route: "/api/v1/leads",
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
