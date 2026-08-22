import type { SupabaseClient } from "@supabase/supabase-js";

import { apiError, apiSuccess } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api/request";
import { getCustomerAccess } from "@/lib/auth/access";
import { requireAuthUser } from "@/lib/auth/dashboard";
import { createAuthenticatedCheckoutSession } from "@/lib/billing/create-checkout-session";
import { getRequestOrigin } from "@/lib/auth/oauth";
import { getMetaAttributionFromRequest } from "@/lib/meta/attribution";
import type { Database } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const { supabase, user } = await requireAuthUser();
    const access = await getCustomerAccess(
      supabase as SupabaseClient<Database>,
      user.id,
    );

    return apiSuccess({
      hasLifetimeAccess: access.hasLifetimeAccess,
    });
  } catch (error) {
    const routeError = handleRouteError(error);
    return apiError(routeError.code, routeError.message, routeError.status);
  }
}

export async function POST(request: Request) {
  try {
    const origin = getRequestOrigin(request);
    const { supabase, user } = await requireAuthUser();
    const access = await getCustomerAccess(
      supabase as SupabaseClient<Database>,
      user.id,
    );

    if (access.hasLifetimeAccess) {
      return apiSuccess({
        alreadyPaid: true,
        redirectUrl: "/dashboard",
      });
    }

    if (!user.email) {
      return apiError(
        "MISSING_EMAIL",
        "Your account needs an email address before checkout.",
        400,
      );
    }

    const session = await createAuthenticatedCheckoutSession({
      userId: user.id,
      email: user.email,
      origin,
      attribution: getMetaAttributionFromRequest(request),
    });

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
