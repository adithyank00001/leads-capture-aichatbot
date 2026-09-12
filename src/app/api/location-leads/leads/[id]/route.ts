import { apiError, apiSuccess } from "@/lib/api-response";
import { handleRouteError, parseJsonBody } from "@/lib/api/request";
import { requireDashboardApiUser } from "@/lib/auth/dashboard-session";
import { getCustomerByUserId } from "@/lib/db/customers";
import { twentyFourHoursAgoIso } from "@/lib/location-leads/time";
import { ApiValidationError } from "@/lib/validation/errors";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { supabase, user } = await requireDashboardApiUser();
    const customer = await getCustomerByUserId(supabase, user.id);

    if (!customer) {
      throw new ApiValidationError(
        "CUSTOMER_NOT_FOUND",
        "Customer account not found.",
        404,
      );
    }

    const body = (await parseJsonBody(request)) as { isSaved?: unknown };
    if (typeof body.isSaved !== "boolean") {
      throw new ApiValidationError(
        "INVALID_BODY",
        "isSaved must be a boolean.",
        400,
      );
    }

    const { data: lead, error: leadError } = await supabase
      .from("maps_leads")
      .select("id, search_id, is_saved, maps_searches!inner(created_at)")
      .eq("id", id)
      .eq("customer_id", customer.id)
      .gt("maps_searches.created_at", twentyFourHoursAgoIso())
      .maybeSingle();

    if (leadError) {
      throw new Error(leadError.message);
    }

    if (!lead) {
      throw new ApiValidationError(
        "LEAD_NOT_FOUND",
        "Lead not found or expired.",
        404,
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from("maps_leads")
      .update({ is_saved: body.isSaved })
      .eq("id", id)
      .eq("customer_id", customer.id)
      .select(
        "id, search_id, place_id, title, category, phone, address, website, rating_value, rating_votes, is_saved, created_at",
      )
      .single();

    if (updateError || !updated) {
      throw new Error(updateError?.message ?? "Could not update lead.");
    }

    return apiSuccess({ lead: updated });
  } catch (error) {
    const routeError = handleRouteError(error);
    return apiError(routeError.code, routeError.message, routeError.status);
  }
}
