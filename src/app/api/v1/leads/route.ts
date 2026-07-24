import { apiError, apiSuccess } from "@/lib/api-response";
import { captureLead } from "@/lib/api/handlers/leads";
import { handleRouteError, parseJsonBody } from "@/lib/api/request";

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody(request);
    const result = await captureLead(body);

    return apiSuccess(result, result.created ? 201 : 200);
  } catch (error) {
    const routeError = handleRouteError(error);
    return apiError(routeError.code, routeError.message, routeError.status);
  }
}
