import { NextResponse } from "next/server";

import { getCustomerAccess } from "@/lib/auth/access";
import { getRequestOrigin, resolvePostLoginRedirect } from "@/lib/auth/oauth";
import { claimPendingLifetimePurchase } from "@/lib/billing/claim-pending-purchase";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const siteOrigin = getRequestOrigin(request);

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user?.email) {
      await claimPendingLifetimePurchase({
        userId: data.user.id,
        email: data.user.email,
      });

      const access = await getCustomerAccess(
        supabase as SupabaseClient<Database>,
        data.user.id,
      );

      return NextResponse.redirect(
        `${siteOrigin}${resolvePostLoginRedirect(access.hasLifetimeAccess)}`,
      );
    }
  }

  const redirectUrl = new URL("/login", siteOrigin);
  redirectUrl.searchParams.set("error", "auth_callback_failed");
  return NextResponse.redirect(redirectUrl);
}
