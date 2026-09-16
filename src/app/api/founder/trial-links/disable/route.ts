import { apiError, apiSuccess } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api/request";
import { hasFounderSession } from "@/lib/founder/auth";
import { disableTrialLink } from "@/lib/trial/db";

export async function POST(request: Request) {
  try {
    if (!(await hasFounderSession())) {
      return apiError("UNAUTHORIZED", "Founder session required.", 401);
    }

    const body = (await request.json()) as { id?: string };
    if (!body.id || typeof body.id !== "string") {
      return apiError("INVALID_INPUT", "Trial link id is required.", 400);
    }

    const link = await disableTrialLink(body.id);
    return apiSuccess({ link, message: "Trial link disabled." });
  } catch (error) {
    const routeError = handleRouteError(error);
    return apiError(routeError.code, routeError.message, routeError.status);
  }
}
