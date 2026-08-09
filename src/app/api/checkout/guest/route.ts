import { apiError, apiSuccess } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api/request";
import { getRequestOrigin } from "@/lib/auth/oauth";
import { createGuestCheckoutSession } from "@/lib/billing/create-checkout-session";

export async function POST(request: Request) {
  try {
    const origin = getRequestOrigin(request);
    const session = await createGuestCheckoutSession({ origin });

    if (!session.checkout_url) {
      return apiError(
        "CHECKOUT_FAILED",
        "Could not start checkout. Please try again.",
        502,
      );
    }

    return apiSuccess({
      checkoutUrl: session.checkout_url,
      sessionId: session.session_id,
    });
  } catch (error) {
    const routeError = handleRouteError(error);
    return apiError(routeError.code, routeError.message, routeError.status);
  }
}
