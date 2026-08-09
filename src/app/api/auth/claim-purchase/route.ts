import { apiError, apiSuccess } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api/request";
import { requireAuthUser } from "@/lib/auth/dashboard";
import { claimPendingLifetimePurchase } from "@/lib/billing/claim-pending-purchase";

export async function POST() {
  try {
    const { user } = await requireAuthUser();

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

    return apiSuccess({
      claimed: result.claimed,
    });
  } catch (error) {
    const routeError = handleRouteError(error);
    return apiError(routeError.code, routeError.message, routeError.status);
  }
}
