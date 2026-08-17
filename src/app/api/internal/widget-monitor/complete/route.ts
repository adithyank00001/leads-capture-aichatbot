import { apiError, apiSuccess } from "@/lib/api-response";
import { handleRouteError, parseJsonBody } from "@/lib/api/request";
import { completeWidgetMonitorCheck } from "@/lib/monitoring/complete";
import { isWidgetMonitoringEnabled } from "@/lib/monitoring/enabled";
import {
  type MonitorCompletePayload,
  verifyMonitorCompletePayload,
} from "@/lib/monitoring/hmac";
import { ApiValidationError } from "@/lib/validation/errors";

export async function POST(request: Request) {
  try {
    if (!isWidgetMonitoringEnabled()) {
      return apiSuccess({ monitoring_disabled: true as const });
    }

    const body = (await parseJsonBody(request)) as MonitorCompletePayload;

    if (body.action !== "monitor_complete" || !verifyMonitorCompletePayload(body)) {
      throw new ApiValidationError("UNAUTHORIZED", "Invalid monitoring signature.", 401);
    }

    const result = await completeWidgetMonitorCheck({
      checkId: body.checkId,
      botId: body.botId,
      pageOk: body.pageOk,
      errorMessage: body.errorMessage,
    });

    return apiSuccess(result);
  } catch (error) {
    const routeError = handleRouteError(error);
    return apiError(routeError.code, routeError.message, routeError.status);
  }
}
