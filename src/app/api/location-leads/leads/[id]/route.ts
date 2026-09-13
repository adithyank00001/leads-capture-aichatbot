import { apiError, apiSuccess } from "@/lib/api-response";
import { handleRouteError, parseJsonBody } from "@/lib/api/request";
import { requireMapsApiUser } from "@/lib/auth/dashboard-session";
import { getCustomerByUserId } from "@/lib/db/customers";
import { MAPS_SAVED_LEADS_MAX } from "@/lib/location-leads/constants";
import { countSavedMapsLeads } from "@/lib/location-leads/db";
import { twentyFourHoursAgoIso } from "@/lib/location-leads/time";
import { ApiValidationError } from "@/lib/validation/errors";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const LEAD_SELECT =
  "id, search_id, place_id, title, category, phone, address, website, rating_value, rating_votes, is_saved, created_at";

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { supabase, user } = await requireMapsApiUser();
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
      .select("id, search_id, is_saved")
      .eq("id", id)
      .eq("customer_id", customer.id)
      .maybeSingle();

    if (leadError) {
      throw new Error(leadError.message);
    }

    if (!lead) {
      throw new ApiValidationError("LEAD_NOT_FOUND", "Lead not found.", 404);
    }

    // Saving from an active search still requires the search to be within 24h.
    // Already-saved leads can be unsaved anytime.
    if (body.isSaved && lead.search_id) {
      const { data: search, error: searchError } = await supabase
        .from("maps_searches")
        .select("id, created_at")
        .eq("id", lead.search_id)
        .eq("customer_id", customer.id)
        .gt("created_at", twentyFourHoursAgoIso())
        .maybeSingle();

      if (searchError) {
        throw new Error(searchError.message);
      }

      if (!search) {
        throw new ApiValidationError(
          "LEAD_NOT_FOUND",
          "Lead not found or search expired. Open Saved leads to manage kept leads.",
          404,
        );
      }
    }

    if (body.isSaved && !lead.is_saved) {
      const savedCount = await countSavedMapsLeads(supabase, customer.id);
      if (savedCount >= MAPS_SAVED_LEADS_MAX) {
        throw new ApiValidationError(
          "SAVED_LIMIT_REACHED",
          `You can save up to ${MAPS_SAVED_LEADS_MAX} leads. Delete some saved leads first.`,
          400,
        );
      }
    }

    // Unsaving a lead whose search is gone: delete it (no orphan unsaved rows).
    if (!body.isSaved && lead.is_saved && !lead.search_id) {
      const { error: deleteError } = await supabase
        .from("maps_leads")
        .delete()
        .eq("id", id)
        .eq("customer_id", customer.id);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      return apiSuccess({
        lead: {
          id,
          search_id: null,
          place_id: null,
          title: null,
          category: null,
          phone: null,
          address: null,
          website: null,
          rating_value: null,
          rating_votes: null,
          is_saved: false,
          created_at: new Date().toISOString(),
        },
      });
    }

    const { data: updated, error: updateError } = await supabase
      .from("maps_leads")
      .update({
        is_saved: body.isSaved,
        saved_at: body.isSaved ? new Date().toISOString() : null,
      })
      .eq("id", id)
      .eq("customer_id", customer.id)
      .select(LEAD_SELECT)
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

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { supabase, user } = await requireMapsApiUser();
    const customer = await getCustomerByUserId(supabase, user.id);

    if (!customer) {
      throw new ApiValidationError(
        "CUSTOMER_NOT_FOUND",
        "Customer account not found.",
        404,
      );
    }

    const { data: lead, error: leadError } = await supabase
      .from("maps_leads")
      .select("id")
      .eq("id", id)
      .eq("customer_id", customer.id)
      .maybeSingle();

    if (leadError) {
      throw new Error(leadError.message);
    }

    if (!lead) {
      throw new ApiValidationError("LEAD_NOT_FOUND", "Lead not found.", 404);
    }

    const { error: deleteError } = await supabase
      .from("maps_leads")
      .delete()
      .eq("id", id)
      .eq("customer_id", customer.id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    return apiSuccess({ deleted: true });
  } catch (error) {
    const routeError = handleRouteError(error);
    return apiError(routeError.code, routeError.message, routeError.status);
  }
}
