import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import {
  isCheckoutApiPath,
  isCheckoutLandingPath,
  isCheckoutPath,
  isCompleteProfilePath,
  isDashboardPath,
  isGuestAllowedCheckoutPath,
  isHiddenPublicMarketingPath,
  isLocationLeadsPath,
  isPaidAppPath,
  isProductsPath,
} from "@/lib/auth/access-paths";
import { PAID_HOME_PATH } from "@/lib/auth/oauth";
import { publicSupabaseConfig } from "@/lib/supabase/config";

type AccessFlags = {
  hasLifetimeAccess: boolean;
  hasMapsAccess: boolean;
  profileCompleted: boolean;
};

async function getAccessFlags(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
): Promise<AccessFlags> {
  const { data } = await supabase
    .from("customers")
    .select("has_lifetime_access, has_maps_access, profile_completed_at")
    .eq("user_id", userId)
    .maybeSingle();

  return {
    hasLifetimeAccess: data?.has_lifetime_access ?? false,
    hasMapsAccess: data?.has_maps_access ?? false,
    profileCompleted: Boolean(data?.profile_completed_at),
  };
}

function redirectTo(request: NextRequest, pathname: string) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = pathname;
  redirectUrl.search = "";
  return NextResponse.redirect(redirectUrl);
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    publicSupabaseConfig.url,
    publicSupabaseConfig.anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const pathname = request.nextUrl.pathname;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (isHiddenPublicMarketingPath(pathname)) {
    if (!user) {
      return redirectTo(request, "/login");
    }

    const access = await getAccessFlags(supabase, user.id);
    if (!access.profileCompleted) {
      return redirectTo(request, "/complete-profile");
    }
    if (access.hasLifetimeAccess || access.hasMapsAccess) {
      return redirectTo(request, PAID_HOME_PATH);
    }
    return redirectTo(request, "/checkout");
  }

  if (!user && isCheckoutPath(pathname)) {
    if (isGuestAllowedCheckoutPath(pathname) || isCheckoutApiPath(pathname)) {
      return supabaseResponse;
    }

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (!user && isPaidAppPath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user) {
    const isPostPaymentLogin =
      pathname === "/login" && request.nextUrl.searchParams.get("paid") === "1";

    const access = await getAccessFlags(supabase, user.id);
    const hasAnyProduct = access.hasLifetimeAccess || access.hasMapsAccess;

    // Hard wall: finish profile before any other app page (except login/signup).
    if (
      !access.profileCompleted &&
      !isCompleteProfilePath(pathname) &&
      pathname !== "/login" &&
      pathname !== "/signup"
    ) {
      return redirectTo(request, "/complete-profile");
    }

    if (access.profileCompleted && isCompleteProfilePath(pathname)) {
      return redirectTo(
        request,
        hasAnyProduct ? PAID_HOME_PATH : "/checkout",
      );
    }

    if (isDashboardPath(pathname) && !access.hasLifetimeAccess) {
      return redirectTo(
        request,
        access.hasMapsAccess ? PAID_HOME_PATH : "/checkout",
      );
    }

    if (isLocationLeadsPath(pathname) && !access.hasMapsAccess) {
      return redirectTo(
        request,
        access.hasLifetimeAccess ? PAID_HOME_PATH : "/checkout",
      );
    }

    if (isProductsPath(pathname) && !hasAnyProduct) {
      return redirectTo(request, "/checkout");
    }

    if (hasAnyProduct && isCheckoutLandingPath(pathname)) {
      return redirectTo(request, PAID_HOME_PATH);
    }

    if (hasAnyProduct && pathname === "/thank-you") {
      return redirectTo(request, PAID_HOME_PATH);
    }

    if (
      !isPostPaymentLogin &&
      (pathname === "/login" || pathname === "/signup")
    ) {
      if (!access.profileCompleted) {
        return redirectTo(request, "/complete-profile");
      }
      return redirectTo(
        request,
        hasAnyProduct ? PAID_HOME_PATH : "/checkout",
      );
    }
  }

  return supabaseResponse;
}
