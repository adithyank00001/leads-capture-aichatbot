import { apiError, apiSuccess } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api/request";
import { hasFounderSession } from "@/lib/founder/auth";
import { createTrialLink, listTrialLinks } from "@/lib/trial/db";

export async function GET() {
  try {
    if (!(await hasFounderSession())) {
      return apiError("UNAUTHORIZED", "Founder session required.", 401);
    }

    const links = await listTrialLinks();
    return apiSuccess({ links });
  } catch (error) {
    const routeError = handleRouteError(error);
    return apiError(routeError.code, routeError.message, routeError.status);
  }
}

export async function POST(request: Request) {
  try {
    if (!(await hasFounderSession())) {
      return apiError("UNAUTHORIZED", "Founder session required.", 401);
    }

    const body = (await request.json().catch(() => ({}))) as {
      note?: string;
    };

    const result = await createTrialLink(body.note);
    return apiSuccess(result, 201);
  } catch (error) {
    const routeError = handleRouteError(error);
    return apiError(routeError.code, routeError.message, routeError.status);
  }
}
