import { NextResponse } from "next/server";

import { getRequestOrigin, getSafeOAuthNextPath } from "@/lib/auth/oauth";
import { claimPendingLifetimePurchase } from "@/lib/billing/claim-pending-purchase";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = getSafeOAuthNextPath(searchParams.get("next"));
  const siteOrigin = getRequestOrigin(request);

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user?.email) {
      await claimPendingLifetimePurchase({
        userId: data.user.id,
        email: data.user.email,
      });
      return NextResponse.redirect(`${siteOrigin}${next}`);
    }
  }

  const redirectUrl = new URL("/login", siteOrigin);
  redirectUrl.searchParams.set("error", "auth_callback_failed");
  return NextResponse.redirect(redirectUrl);
}
