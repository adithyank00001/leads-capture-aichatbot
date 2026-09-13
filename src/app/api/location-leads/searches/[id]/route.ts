import { apiError, apiSuccess } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api/request";
import { requireMapsApiUser } from "@/lib/auth/dashboard-session";
import { getCustomerByUserId } from "@/lib/db/customers";
import { getMapsSearchById } from "@/lib/location-leads/db";
import { ApiValidationError } from "@/lib/validation/errors";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
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

    const search = await getMapsSearchById(supabase, customer.id, id);
    if (!search) {
      throw new ApiValidationError(
        "SEARCH_NOT_FOUND",
        "Search not found or expired.",
        404,
      );
    }

    return apiSuccess({ search });
  } catch (error) {
    const routeError = handleRouteError(error);
    return apiError(routeError.code, routeError.message, routeError.status);
  }
}
