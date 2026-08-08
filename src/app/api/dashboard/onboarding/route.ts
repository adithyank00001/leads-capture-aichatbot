import { apiError, apiSuccess } from "@/lib/api-response";
import { requireDashboardApiUser } from "@/lib/auth/dashboard-session";
import { ensureCustomerOnboarding } from "@/lib/dashboard/onboarding";
import { handleRouteError } from "@/lib/api/request";

export async function POST() {
  try {
    const { supabase, user } = await requireDashboardApiUser();
    const result = await ensureCustomerOnboarding(supabase, {
      userId: user.id,
      email: user.email ?? "",
    });

    return apiSuccess(result);
  } catch (error) {
    const routeError = handleRouteError(error);
    return apiError(routeError.code, routeError.message, routeError.status);
  }
}
