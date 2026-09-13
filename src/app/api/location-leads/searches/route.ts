import { after } from "next/server";

import { apiError, apiSuccess } from "@/lib/api-response";
import { handleRouteError, parseJsonBody } from "@/lib/api/request";
import { requireDashboardApiUser } from "@/lib/auth/dashboard-session";
import { assertDataForSeoConfigured } from "@/lib/dataforseo/client";
import {
  buildMapsPostbackUrl,
  postGoogleMapsTask,
} from "@/lib/dataforseo/maps-task-post";
import { resolveMapsLocation } from "@/lib/dataforseo/resolve-location";
import { getCustomerByUserId } from "@/lib/db/customers";
import {
  deductMapsCredits,
  refundMapsCredits,
} from "@/lib/location-leads/credits";
import {
  MAPS_SEARCH_DEPTH_MAX,
  MAPS_SEARCH_DEPTH_MIN,
  parseMapsSearchDepth,
} from "@/lib/location-leads/constants";
import { listRecentMapsSearches } from "@/lib/location-leads/db";
import { buildNormalizedLocationName } from "@/lib/location-leads/location";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { ApiValidationError } from "@/lib/validation/errors";

function friendlyTaskError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("verify your account")) {
    return "DataForSEO account is not verified yet. Open https://app.dataforseo.com/ and complete verification, then try again. Your credits were refunded.";
  }
  if (
    lower.includes("invalid field") ||
    lower.includes("location_not_supported") ||
    lower.includes("not supported")
  ) {
    return "That location is not supported by the lead database. Try Country only, or a different State/City. Your credits were refunded.";
  }
  return message;
}

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
      countryIso?: unknown;
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

    const depth = parseMapsSearchDepth(body.depth);
    if (depth === null) {
      throw new ApiValidationError(
        "INVALID_DEPTH",
        `Enter a whole number from ${MAPS_SEARCH_DEPTH_MIN} to ${MAPS_SEARCH_DEPTH_MAX}.`,
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

    // Always return JSON fast. Resolve DataForSEO location_code + Task POST
    // in the background so proxies never return HTML gateway timeout pages.
    const searchId = search.id;
    const customerId = customer.id;
    const postKeyword = keyword;
    const postDepth = depth;
    const postCountryIso = countryIso;
    const postCountry = location.country;
    const postState = location.state;
    const postCity = location.city;

    after(async () => {
      const admin = getSupabaseAdmin();
      try {
        const resolved = await resolveMapsLocation({
          countryIso: postCountryIso,
          countryName: postCountry,
          stateName: postState,
          cityName: postCity,
        });

        const postbackUrl = buildMapsPostbackUrl(searchId);
        const task = await postGoogleMapsTask({
          keyword: postKeyword,
          locationCode: resolved.locationCode,
          locationName: resolved.locationName,
          depth: postDepth,
          searchId,
          postbackUrl,
        });

        await admin
          .from("maps_searches")
          .update({
            status: "submitted",
            dataforseo_task_id: task.taskId,
            location_name: resolved.locationName,
          })
          .eq("id", searchId)
          .eq("customer_id", customerId);
      } catch (taskError) {
        const message =
          taskError instanceof Error
            ? taskError.message
            : "Failed to start lead search.";
        const friendlyMessage = friendlyTaskError(message);

        await admin
          .from("maps_searches")
          .update({
            status: "failed",
            error_message: friendlyMessage,
          })
          .eq("id", searchId)
          .eq("customer_id", customerId);

        await admin.rpc("maps_refund_credits", {
          p_customer_id: customerId,
          p_amount: postDepth,
        });
      }
    });

    return apiSuccess({ search }, 201);
  } catch (error) {
    const routeError = handleRouteError(error);
    return apiError(routeError.code, routeError.message, routeError.status);
  }
}
