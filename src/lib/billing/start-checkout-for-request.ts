import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { getCustomerAccess } from "@/lib/auth/access";
import { getRequestOrigin } from "@/lib/auth/oauth";
import {
  createAuthenticatedCheckoutSession,
  createGuestCheckoutSession,
} from "@/lib/billing/create-checkout-session";
import { getMetaAttributionFromRequest } from "@/lib/meta/attribution";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/admin";
import { ApiValidationError } from "@/lib/validation/errors";

export type StartCheckoutForRequestResult =
  | {
      alreadyPaid: true;
      redirectUrl: "/dashboard";
    }
  | {
      alreadyPaid?: false;
      checkoutUrl: string;
      sessionId: string;
    };

export async function startCheckoutForRequest(
  request: Request,
): Promise<StartCheckoutForRequestResult> {
  const origin = getRequestOrigin(request);
  const attribution = getMetaAttributionFromRequest(request);
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email) {
    const access = await getCustomerAccess(
      supabase as SupabaseClient<Database>,
      user.id,
    );

    if (access.hasLifetimeAccess) {
      return {
        alreadyPaid: true,
        redirectUrl: "/dashboard",
      };
    }

    const session = await createAuthenticatedCheckoutSession({
      userId: user.id,
      email: user.email,
      origin,
      attribution,
    });

    if (!session.checkout_url) {
      throw new ApiValidationError(
        "CHECKOUT_FAILED",
        "Could not start checkout. Please try again.",
        502,
      );
    }

    return {
      checkoutUrl: session.checkout_url,
      sessionId: session.session_id,
    };
  }

  const session = await createGuestCheckoutSession({ origin, attribution });

  if (!session.checkout_url) {
    throw new ApiValidationError(
      "CHECKOUT_FAILED",
      "Could not start checkout. Please try again.",
      502,
    );
  }

  return {
    checkoutUrl: session.checkout_url,
    sessionId: session.session_id,
  };
}
