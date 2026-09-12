import { type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Public marketing pages are gated (redirect guests to login).
    "/",
    "/landing-b",
    "/landing-b/",
    "/demo",
    "/demo/",
    "/login",
    "/signup",
    "/checkout",
    "/checkout/:path*",
    "/products",
    "/products/:path*",
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
  ],
};
