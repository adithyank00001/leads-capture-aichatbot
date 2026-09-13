import { apiError } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api/request";
import { requireMapsApiUser } from "@/lib/auth/dashboard-session";
import { getCustomerByUserId } from "@/lib/db/customers";
import { buildLeadsCsv } from "@/lib/location-leads/csv";
import {
  listLeadsForSearch,
  listSavedMapsLeads,
} from "@/lib/location-leads/db";
import { ApiValidationError } from "@/lib/validation/errors";

export async function GET(request: Request) {
  try {
    const { supabase, user } = await requireMapsApiUser();
    const customer = await getCustomerByUserId(supabase, user.id);

    if (!customer) {
      throw new ApiValidationError(
        "CUSTOMER_NOT_FOUND",
        "Customer account not found.",
        404,
      );
    }

    const { searchParams } = new URL(request.url);
    const searchId = searchParams.get("search_id");
    const savedOnly = searchParams.get("saved") === "1";

    let rows: Array<Record<string, string | number | boolean | null | undefined>> =
      [];
    let filename = "leads-export.csv";

    if (savedOnly) {
      const leads = await listSavedMapsLeads(supabase, customer.id);
      rows = leads.map((lead) => ({
        title: lead.title,
        category: lead.category,
        phone: lead.phone,
        address: lead.address,
        website: lead.website,
        rating_value: lead.rating_value,
        rating_votes: lead.rating_votes,
        latitude: lead.latitude,
        longitude: lead.longitude,
        place_id: lead.place_id,
        cid: lead.cid,
        is_claimed: lead.is_claimed,
        snippet: lead.snippet,
      }));
      filename = "saved-leads-export.csv";
    } else if (searchId) {
      const result = await listLeadsForSearch(supabase, customer.id, searchId);
      if (!result) {
        throw new ApiValidationError(
          "SEARCH_NOT_FOUND",
          "Search not found or expired.",
          404,
        );
      }
      rows = result.leads.map((lead) => ({
        title: lead.title,
        category: lead.category,
        phone: lead.phone,
        address: lead.address,
        website: lead.website,
        rating_value: lead.rating_value,
        rating_votes: lead.rating_votes,
        latitude: lead.latitude,
        longitude: lead.longitude,
        place_id: lead.place_id,
        cid: lead.cid,
        is_claimed: lead.is_claimed,
        snippet: lead.snippet,
      }));
      filename = `search-${searchId.slice(0, 8)}-leads.csv`;
    } else {
      throw new ApiValidationError(
        "INVALID_QUERY",
        "Provide search_id or saved=1.",
        400,
      );
    }

    const csv = buildLeadsCsv(rows);

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const routeError = handleRouteError(error);
    return apiError(routeError.code, routeError.message, routeError.status);
  }
}
