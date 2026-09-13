import { apiError, apiSuccess } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api/request";
import { getCustomerAccess } from "@/lib/auth/access";
import { requireAuthUser } from "@/lib/auth/dashboard";
import { PAID_HOME_PATH } from "@/lib/auth/oauth";
import { syncLifetimeAccessForEmail } from "@/lib/billing/sync-lifetime-access";
import { syncMapsAccessForEmail } from "@/lib/billing/sync-maps-access";
import { ensureCustomerOnboarding } from "@/lib/dashboard/onboarding";
import type { Database } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

function normalizeFullName(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (trimmed.length < 2 || trimmed.length > 80) {
    return null;
  }
  return trimmed;
}

function normalizeMobilePhone(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  // Keep digits, spaces, +, -, ()
  const cleaned = trimmed.replace(/[^\d+\-\s()]/g, "");
  const digitsOnly = cleaned.replace(/\D/g, "");
  if (digitsOnly.length < 8 || digitsOnly.length > 15) {
    return null;
  }
  if (cleaned.length < 8 || cleaned.length > 20) {
    return null;
  }
  return cleaned;
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireAuthUser();

    if (!user.email) {
      return apiError(
        "MISSING_EMAIL",
        "Your account needs an email address.",
        400,
      );
    }

    const body = (await request.json()) as {
      fullName?: unknown;
      mobilePhone?: unknown;
    };

    const fullName = normalizeFullName(body.fullName);
    const mobilePhone = normalizeMobilePhone(body.mobilePhone);

    if (!fullName) {
      return apiError(
        "INVALID_NAME",
        "Please enter your full name (at least 2 characters).",
        400,
      );
    }

    if (!mobilePhone) {
      return apiError(
        "INVALID_MOBILE",
        "Please enter a valid mobile number with country code.",
        400,
      );
    }

    await ensureCustomerOnboarding(supabase, {
      userId: user.id,
      email: user.email,
    });

    const existing = await getCustomerAccess(
      supabase as SupabaseClient<Database>,
      user.id,
    );

    if (existing.profileCompleted) {
      return apiSuccess({
        redirectTo:
          existing.hasLifetimeAccess || existing.hasMapsAccess
            ? PAID_HOME_PATH
            : "/checkout",
      });
    }

    const { error: updateError } = await supabase
      .from("customers")
      .update({
        full_name: fullName,
        mobile_phone: mobilePhone,
        profile_completed_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .is("profile_completed_at", null);

    if (updateError) {
      throw new Error(updateError.message);
    }

    await syncLifetimeAccessForEmail({
      userId: user.id,
      email: user.email,
    });

    await syncMapsAccessForEmail({
      userId: user.id,
      email: user.email,
    });

    const access = await getCustomerAccess(
      supabase as SupabaseClient<Database>,
      user.id,
    );

    return apiSuccess({
      redirectTo:
        access.hasLifetimeAccess || access.hasMapsAccess
          ? PAID_HOME_PATH
          : "/checkout",
    });
  } catch (error) {
    const routeError = handleRouteError(error);
    return apiError(routeError.code, routeError.message, routeError.status);
  }
}
