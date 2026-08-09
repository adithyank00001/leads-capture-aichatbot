import { CheckoutCard } from "@/components/checkout/checkout-card";
import { getCustomerAccess } from "@/lib/auth/access";
import { claimPendingLifetimePurchase } from "@/lib/billing/claim-pending-purchase";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

type CheckoutPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const { error } = await searchParams;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email) {
    const access = await getCustomerAccess(
      supabase as SupabaseClient<Database>,
      user.id,
    );

    if (!access.hasLifetimeAccess) {
      await claimPendingLifetimePurchase({
        userId: user.id,
        email: user.email,
      });
    }
  }

  return (
    <div className="relative min-h-screen bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.52_0.19_252/0.12),transparent_55%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-4 py-10">
        <CheckoutCard
          errorCode={error}
          mode={user ? "authenticated" : "guest"}
        />
      </div>
    </div>
  );
}
