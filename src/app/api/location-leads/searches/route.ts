import { apiError, apiSuccess } from "@/lib/api-response";
import { handleRouteError, parseJsonBody } from "@/lib/api/request";
import { requireDashboardApiUser } from "@/lib/auth/dashboard-session";
import {
  buildMapsPostbackUrl,
  postGoogleMapsTask,
} from "@/lib/dataforseo/maps-task-post";
import { getCustomerByUserId } from "@/lib/db/customers";
import { assertDataForSeoConfigured } from "@/lib/dataforseo/client";
import {
  deductMapsCredits,
  refundMapsCredits,
} from "@/lib/location-leads/credits";
import {
  isMapsSearchDepth,
  type MapsSearchDepth,
} from "@/lib/location-leads/constants";
import { listRecentMapsSearches } from "@/lib/location-leads/db";
import { buildNormalizedLocationName } from "@/lib/location-leads/location";
import { ApiValidationError } from "@/lib/validation/errors";

export async function GET() {
  try {
    const { supabase, user } = await requireDashboardApiUser();
    const customer = await getCustomerByUserId(supabase, user.id);

    if (!customer) {
      return apiSuccess({ searches: [] });
    }

    const searches = await listRecentMapsSearches(supabase, customer.id);
    return apiSuccess({ searches });
  } catch (error) {
    const routeError = handleRouteError(error);
    return apiError(routeError.code, routeError.message, routeError.status);
  }
}

export async function POST(request: Request) {
  try {
    assertDataForSeoConfigured();

    const { supabase, user } = await requireDashboardApiUser();
    const customer = await getCustomerByUserId(supabase, user.id);

    if (!customer) {
      throw new ApiValidationError(
        "CUSTOMER_NOT_FOUND",
        "Customer account not found.",
        404,
      );
    }

    const body = (await parseJsonBody(request)) as {
      keyword?: unknown;
      country?: unknown;
      state?: unknown;
      city?: unknown;
      depth?: unknown;
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

    const depthValue =
      typeof body.depth === "string" ? Number(body.depth) : body.depth;
    if (!isMapsSearchDepth(depthValue)) {
      throw new ApiValidationError(
        "INVALID_DEPTH",
        "Choose a valid search depth.",
        400,
      );
    }
    const depth: MapsSearchDepth = depthValue;

    const location = buildNormalizedLocationName({
      country: typeof body.country === "string" ? body.country : "",
      state: typeof body.state === "string" ? body.state : null,
      city: typeof body.city === "string" ? body.city : null,
    });

    await deductMapsCredits(supabase, customer.id, depth);

    const { data: search, error: insertError } = await supabase
      .from("maps_searches")
      .insert({
        customer_id: customer.id,
        keyword,
        country: location.country,
        state: location.state,
        city: location.city,
        location_name: location.locationName,
        depth,
        credits_charged: depth,
        status: "queued",
      })
      .select(
        "id, keyword, country, state, city, location_name, depth, credits_charged, status, results_count, created_at",
      )
      .single();

    if (insertError || !search) {
      await refundMapsCredits(supabase, customer.id, depth);
      throw new Error(insertError?.message ?? "Could not create search.");
    }

    try {
      const postbackUrl = buildMapsPostbackUrl(search.id);
      const task = await postGoogleMapsTask({
        keyword,
        locationName: location.locationName,
        depth,
        searchId: search.id,
        postbackUrl,
      });

      const { data: submitted, error: updateError } = await supabase
        .from("maps_searches")
        .update({
          status: "submitted",
          dataforseo_task_id: task.taskId,
        })
        .eq("id", search.id)
        .eq("customer_id", customer.id)
        .select(
          "id, keyword, country, state, city, location_name, depth, credits_charged, status, results_count, dataforseo_task_id, created_at",
        )
        .single();

      if (updateError || !submitted) {
        throw new Error(updateError?.message ?? "Could not update search.");
      }

      return apiSuccess({ search: submitted }, 201);
    } catch (taskError) {
      const message =
        taskError instanceof Error
          ? taskError.message
          : "Failed to start lead search.";

      await supabase
        .from("maps_searches")
        .update({
          status: "failed",
          error_message: message,
        })
        .eq("id", search.id)
        .eq("customer_id", customer.id);

      await refundMapsCredits(supabase, customer.id, depth);

      throw new ApiValidationError("SEARCH_START_FAILED", message, 502);
    }
  } catch (error) {
    const routeError = handleRouteError(error);
    return apiError(routeError.code, routeError.message, routeError.status);
  }
}
