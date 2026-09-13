import { apiError, apiSuccess } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api/request";
import { requireMapsApiUser } from "@/lib/auth/dashboard-session";
import { getCustomerByUserId } from "@/lib/db/customers";
import { listSavedMapsLeads } from "@/lib/location-leads/db";

export async function GET() {
  try {
    const { supabase, user } = await requireMapsApiUser();
    const customer = await getCustomerByUserId(supabase, user.id);

    if (!customer) {
      return apiSuccess({ leads: [] });
    }

    const leads = await listSavedMapsLeads(supabase, customer.id);
    return apiSuccess({ leads });
  } catch (error) {
    const routeError = handleRouteError(error);
    return apiError(routeError.code, routeError.message, routeError.status);
  }
}
