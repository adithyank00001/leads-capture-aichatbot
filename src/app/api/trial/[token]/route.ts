import { apiError, apiSuccess } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api/request";
import {
  TRIAL_EXPIRED_MESSAGE,
  TRIAL_VISIBLE_LEADS,
} from "@/lib/trial/constants";
import {
  getLatestTrialSearch,
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

    const search = await getLatestTrialSearch(link.id);
    const inProgress =
      search?.status === "queued" || search?.status === "submitted";
    const leads =
      link.search_used && search?.status === "completed"
        ? await listTrialPublicLeads(link.id)
        : [];

    return apiSuccess({
      trial: {
        status: link.status,
        searchUsed: link.search_used,
        expiresAt: link.expires_at,
        visibleLeadLimit: TRIAL_VISIBLE_LEADS,
        canSearch:
          !link.search_used &&
          link.status === "unused" &&
          !inProgress,
      },
      search: search
        ? {
            id: search.id,
            keyword: search.keyword,
            locationName: search.location_name,
            status: search.status,
            resultsCount: search.results_count,
            errorMessage: search.error_message,
            createdAt: search.created_at,
            completedAt: search.completed_at,
          }
        : null,
      leads,
    });
  } catch (error) {
    const routeError = handleRouteError(error);
    return apiError(routeError.code, routeError.message, routeError.status);
  }
}
