import { apiError, apiSuccess } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api/request";
import { requireMapsApiUser } from "@/lib/auth/dashboard-session";
import { getCustomerByUserId } from "@/lib/db/customers";
import { getMapsCreditBalance } from "@/lib/location-leads/credits";

export async function GET() {
  try {
    const { supabase, user } = await requireMapsApiUser();
    const customer = await getCustomerByUserId(supabase, user.id);

    if (!customer) {
      return apiSuccess({
        limit: 100_000,
        used: 0,
        remaining: 100_000,
      });
    }

    const balance = await getMapsCreditBalance(supabase, customer.id);
    return apiSuccess(balance);
  } catch (error) {
    const routeError = handleRouteError(error);
    return apiError(routeError.code, routeError.message, routeError.status);
  }
}
