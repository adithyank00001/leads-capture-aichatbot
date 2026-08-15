import { NextResponse } from "next/server";

import { apiError, apiSuccess } from "@/lib/api-response";
import { handleRouteError, parseJsonBody } from "@/lib/api/request";
import { widgetHeartbeatCorsHeaders } from "@/lib/monitoring/cors";
import { recordWidgetHeartbeat } from "@/lib/monitoring/heartbeat";
import { ApiValidationError } from "@/lib/validation/errors";

type HeartbeatPayload = {
  botId?: string;
  pageUrl?: string;
  checkId?: string | null;
};

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: widgetHeartbeatCorsHeaders(request),
  });
}

export async function POST(request: Request) {
  const cors = widgetHeartbeatCorsHeaders(request);

  try {
    const body = (await parseJsonBody(request)) as HeartbeatPayload;
    const botId = body.botId?.trim();
    const pageUrl = body.pageUrl?.trim();

    if (!botId || !pageUrl) {
      throw new ApiValidationError(
        "INVALID_HEARTBEAT",
        "botId and pageUrl are required.",
      );
    }

    const result = await recordWidgetHeartbeat({
      botId,
      pageUrl,
      checkId: body.checkId,
    });

    const response = apiSuccess(result);
    Object.entries(cors).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  } catch (error) {
    const routeError = handleRouteError(error, {
      isPublicApi: true,
      route: "/api/v1/widget-heartbeat",
    });
    const response = apiError(
      routeError.code,
      routeError.message,
      routeError.status,
      routeError.errorId,
    );
    Object.entries(cors).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }
}
