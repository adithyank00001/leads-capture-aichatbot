import { apiError, apiSuccess } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api/request";
import { getCustomerAccess } from "@/lib/auth/access";
import { requireAuthUser } from "@/lib/auth/dashboard";
import { claimPendingLifetimePurchase } from "@/lib/billing/claim-pending-purchase";
import type { Database } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function POST() {
  try {
    const { supabase, user } = await requireAuthUser();

    if (!user.email) {
      return apiError(
        "MISSING_EMAIL",
        "Your account needs an email address before claiming a purchase.",
        400,
      );
    }

    const result = await claimPendingLifetimePurchase({
      userId: user.id,
      email: user.email,
    });

    const access = await getCustomerAccess(
      supabase as SupabaseClient<Database>,
      user.id,
    );

    return apiSuccess({
      claimed: result.claimed,
      hasLifetimeAccess: access.hasLifetimeAccess,
    });
  } catch (error) {
    const routeError = handleRouteError(error);
    return apiError(routeError.code, routeError.message, routeError.status);
  }
}
