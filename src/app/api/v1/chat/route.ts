import { apiError, apiSuccess } from "@/lib/api-response";
import { sendChatMessage } from "@/lib/api/handlers/chat";
import { handleRouteError, parseJsonBody } from "@/lib/api/request";

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody(request);
    const result = await sendChatMessage(body);

    return apiSuccess(result);
  } catch (error) {
    const routeError = handleRouteError(error);
    return apiError(routeError.code, routeError.message, routeError.status);
  }
}
