import { apiError, apiSuccess } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api/request";
import { requireMapsApiUser } from "@/lib/auth/dashboard-session";
import { getCustomerByUserId } from "@/lib/db/customers";
import { getMapsCreditBalance } from "@/lib/location-leads/credits";
import { MAPS_DAILY_LEADS_LIMIT, MAPS_LEAD_CREDIT_LIMIT } from "@/lib/location-leads/constants";

export async function GET() {
  try {
    const { supabase, user } = await requireMapsApiUser();
    const customer = await getCustomerByUserId(supabase, user.id);

    if (!customer) {
      return apiSuccess({
        limit: MAPS_LEAD_CREDIT_LIMIT,
        used: 0,
        remaining: MAPS_LEAD_CREDIT_LIMIT,
        dailyLimit: MAPS_DAILY_LEADS_LIMIT,
        dailyUsed: 0,
        dailyRemaining: MAPS_DAILY_LEADS_LIMIT,
      });
    }

    const balance = await getMapsCreditBalance(supabase, customer.id);
    return apiSuccess(balance);
  } catch (error) {
    const routeError = handleRouteError(error);
    return apiError(routeError.code, routeError.message, routeError.status);
  }
}
