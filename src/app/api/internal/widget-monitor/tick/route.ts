import { apiError, apiSuccess } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api/request";
import { dispatchDueWidgetMonitorCheck } from "@/lib/monitoring/dispatch";
import { verifyCronSecret } from "@/lib/monitoring/hmac";
import { ApiValidationError } from "@/lib/validation/errors";

export async function POST(request: Request) {
  try {
    if (!verifyCronSecret(request.headers.get("authorization"))) {
      throw new ApiValidationError("UNAUTHORIZED", "Unauthorized.", 401);
    }

    const result = await dispatchDueWidgetMonitorCheck();
    return apiSuccess(result);
  } catch (error) {
    const routeError = handleRouteError(error);
    return apiError(routeError.code, routeError.message, routeError.status);
  }
}
