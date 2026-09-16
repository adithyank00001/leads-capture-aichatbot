import { after } from "next/server";

import { apiError, apiSuccess } from "@/lib/api-response";
import { handleRouteError, parseJsonBody } from "@/lib/api/request";
import { assertDataForSeoConfigured } from "@/lib/dataforseo/client";
import {
  buildTrialMapsPostbackUrl,
  postGoogleMapsTask,
} from "@/lib/dataforseo/maps-task-post";
import { resolveMapsLocation } from "@/lib/dataforseo/resolve-location";
import { buildNormalizedLocationName } from "@/lib/location-leads/location";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { TRIAL_PROVIDER_DEPTH } from "@/lib/trial/constants";
import {
  canStartTrialSearch,
  getLatestTrialSearch,
  getTrialLinkByToken,
  refreshTrialLinkExpiry,
} from "@/lib/trial/db";
import { assertTrialSearchRateLimit } from "@/lib/trial/rate-limit";
import { ApiValidationError } from "@/lib/validation/errors";

type RouteContext = {
  params: Promise<{ token: string }>;
};

function friendlyTaskError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("verify your account")) {
    return "DataForSEO account is not verified yet. Please try again later.";
  }
  if (
    lower.includes("invalid field") ||
    lower.includes("location_not_supported") ||
    lower.includes("not supported")
  ) {
    return "That location is not supported. Try Country only, or a different State/City.";
  }
  return message;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    assertDataForSeoConfigured();
    await assertTrialSearchRateLimit(request);

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
    const gate = canStartTrialSearch(link);
    if (!gate.ok) {
      return apiError(gate.code ?? "FORBIDDEN", gate.message ?? "Not allowed.", 403);
    }

    const latest = await getLatestTrialSearch(link.id);
    if (
      latest &&
      (latest.status === "queued" ||
        latest.status === "submitted" ||
        latest.status === "completed")
    ) {
      if (latest.status === "completed") {
        return apiError(
          "TRIAL_SEARCH_USED",
          "This trial already used its one search.",
          403,
        );
      }
      return apiError(
        "TRIAL_SEARCH_IN_PROGRESS",
        "A trial search is already running. Please wait.",
        409,
      );
    }

    const body = (await parseJsonBody(request)) as {
      keyword?: unknown;
      country?: unknown;
      countryIso?: unknown;
      state?: unknown;
      city?: unknown;
    };

    const keyword =
      typeof body.keyword === "string" ? body.keyword.trim() : "";
    if (!keyword || keyword.length > 700) {
      throw new ApiValidationError(
        "INVALID_KEYWORD",
        "Keyword is required (max 700 characters).",
        400,
      );
    }

    const countryIso =
      typeof body.countryIso === "string" ? body.countryIso.trim() : "";
    if (!countryIso || countryIso.length !== 2) {
      throw new ApiValidationError(
        "INVALID_LOCATION",
        "Please select a country from the list.",
        400,
      );
    }

    const location = buildNormalizedLocationName({
      country: typeof body.country === "string" ? body.country : "",
      state: typeof body.state === "string" ? body.state : null,
      city: typeof body.city === "string" ? body.city : null,
    });

    const admin = getSupabaseAdmin();
    const { data: search, error: insertError } = await admin
      .from("trial_searches")
      .insert({
        trial_link_id: link.id,
        keyword,
        country: location.country,
        state: location.state,
        city: location.city,
        location_name: location.locationName,
        depth: TRIAL_PROVIDER_DEPTH,
        status: "queued",
      })
      .select(
        "id, trial_link_id, keyword, country, state, city, location_name, depth, status, results_count, created_at",
      )
      .single();

    if (insertError || !search) {
      throw new Error(insertError?.message ?? "Could not create trial search.");
    }

    const searchId = search.id;
    const trialLinkId = link.id;
    const postKeyword = keyword;
    const postCountryIso = countryIso;
    const postCountry = location.country;
    const postState = location.state;
    const postCity = location.city;

    after(async () => {
      const bgAdmin = getSupabaseAdmin();
      try {
        const resolved = await resolveMapsLocation({
          countryIso: postCountryIso,
          countryName: postCountry,
          stateName: postState,
          cityName: postCity,
        });

        const postbackUrl = buildTrialMapsPostbackUrl(searchId);
        const task = await postGoogleMapsTask({
          keyword: postKeyword,
          locationCode: resolved.locationCode,
          locationName: resolved.locationName,
          depth: TRIAL_PROVIDER_DEPTH,
          searchId,
          postbackUrl,
        });

        await bgAdmin
          .from("trial_searches")
          .update({
            status: "submitted",
            dataforseo_task_id: task.taskId,
            location_name: resolved.locationName,
          })
          .eq("id", searchId)
          .eq("trial_link_id", trialLinkId);
      } catch (taskError) {
        const message =
          taskError instanceof Error
            ? taskError.message
            : "Failed to start trial search.";
        const friendlyMessage = friendlyTaskError(message);

        await bgAdmin
          .from("trial_searches")
          .update({
            status: "failed",
            error_message: friendlyMessage,
          })
          .eq("id", searchId)
          .eq("trial_link_id", trialLinkId);
      }
    });

    return apiSuccess(
      {
        search: {
          id: search.id,
          status: search.status,
          depth: TRIAL_PROVIDER_DEPTH,
          visibleLeadLimit: 10,
        },
      },
      201,
    );
  } catch (error) {
    const routeError = handleRouteError(error);
    return apiError(routeError.code, routeError.message, routeError.status);
  }
}
