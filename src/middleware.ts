import { type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Intentionally omit "/" so the Meta ads landing page stays fully static
    // (no edge middleware / no Supabase on every ad click).
    "/login",
    "/signup",
    "/checkout",
    "/checkout/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/api/checkout",
    "/api/checkout/:path*",
    "/api/dashboard",
    "/api/dashboard/:path*",
  ],
};
