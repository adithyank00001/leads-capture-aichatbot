import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import {
  isCheckoutApiPath,
  isCheckoutLandingPath,
  isCheckoutPath,
  isGuestAllowedCheckoutPath,
} from "@/lib/auth/access-paths";
import { publicSupabaseConfig } from "@/lib/supabase/config";

async function getHasLifetimeAccess(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
) {
  const { data } = await supabase
    .from("customers")
    .select("has_lifetime_access")
    .eq("user_id", userId)
    .maybeSingle();

  return data?.has_lifetime_access ?? false;
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

  if (!user && isCheckoutPath(pathname)) {
    if (isGuestAllowedCheckoutPath(pathname)) {
      return supabaseResponse;
    }

    if (isCheckoutApiPath(pathname)) {
      return supabaseResponse;
    }

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (!user && pathname.startsWith("/dashboard")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user) {
    const isPostPaymentLogin =
      pathname === "/login" &&
      request.nextUrl.searchParams.get("paid") === "1";

    const hasLifetimeAccess = await getHasLifetimeAccess(supabase, user.id);

    if (pathname.startsWith("/dashboard") && !hasLifetimeAccess) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/checkout";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }

    if (hasLifetimeAccess && isCheckoutLandingPath(pathname)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/dashboard";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }

    if (hasLifetimeAccess && pathname === "/thank-you") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/dashboard";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }

    if (
      !isPostPaymentLogin &&
      (pathname === "/login" || pathname === "/signup")
    ) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = hasLifetimeAccess ? "/dashboard" : "/checkout";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return supabaseResponse;
}
