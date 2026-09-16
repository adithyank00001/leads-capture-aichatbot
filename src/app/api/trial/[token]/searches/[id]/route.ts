import { apiError, apiSuccess } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api/request";
import { TRIAL_EXPIRED_MESSAGE } from "@/lib/trial/constants";
import {
  getTrialLinkByToken,
  refreshTrialLinkExpiry,
} from "@/lib/trial/db";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{ token: string; id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { token: rawToken, id } = await context.params;
    const token = decodeURIComponent(rawToken ?? "").trim();
    if (!token || token.length < 16 || !id) {
      return apiError("NOT_FOUND", "Not found.", 404);
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

    const admin = getSupabaseAdmin();
    const { data: search, error } = await admin
      .from("trial_searches")
      .select(
        "id, keyword, country, state, city, location_name, depth, status, error_message, results_count, created_at, completed_at",
      )
      .eq("id", id)
      .eq("trial_link_id", link.id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }
    if (!search) {
      return apiError("NOT_FOUND", "Search not found.", 404);
    }

    return apiSuccess({ search });
  } catch (error) {
    const routeError = handleRouteError(error);
    return apiError(routeError.code, routeError.message, routeError.status);
  }
}
