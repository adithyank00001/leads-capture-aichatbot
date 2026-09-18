import { type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Hidden marketing pages are gated (redirect guests to login).
    "/landing-old",
    "/landing-old/",
    "/landing-old-b2b",
    "/landing-old-b2b/",
    "/demo",
    "/demo/",
    "/login",
    "/signup",
    "/checkout",
    "/checkout/:path*",
    "/products",
    "/products/:path*",
    "/complete-profile",
    "/complete-profile/:path*",
    "/api/account/profile",
    "/dashboard",
    "/dashboard/:path*",
    "/location-leads",
    "/location-leads/:path*",
    "/api/location-leads",
    "/api/location-leads/:path*",
    "/api/checkout",
    "/api/checkout/:path*",
    "/api/dashboard",
    "/api/dashboard/:path*",
    "/founder",
    "/founder/:path*",
    "/api/founder",
    "/api/founder/:path*",
  ],
};
