import { apiError, apiSuccess } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api/request";
import { TRIAL_EXPIRED_MESSAGE } from "@/lib/trial/constants";
import {
  getTrialLinkByToken,
  listTrialPublicLeads,
  refreshTrialLinkExpiry,
} from "@/lib/trial/db";

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { token: rawToken } = await context.params;
    const token = decodeURIComponent(rawToken ?? "").trim();
    if (!token || token.length < 16) {
      return apiError("NOT_FOUND", "Trial link not found.", 404);
    }

    const found = await getTrialLinkByToken(token);
    if (!found) {
      return apiError("NOT_FOUND", "Trial link not found.", 404);
    }

    const link = await refreshTrialLinkExpiry(found);
    if (link.status === "expired") {
      return apiError("TRIAL_EXPIRED", TRIAL_EXPIRED_MESSAGE, 410);
    }
    if (link.status === "disabled") {
      return apiError("TRIAL_DISABLED", "This trial link was disabled.", 410);
    }

    if (!link.search_used && link.status === "unused") {
      return apiSuccess({ leads: [] });
    }

    const leads = await listTrialPublicLeads(link.id);
    return apiSuccess({ leads });
  } catch (error) {
    const routeError = handleRouteError(error);
    return apiError(routeError.code, routeError.message, routeError.status);
  }
}
