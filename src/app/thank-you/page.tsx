import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/dashboard/login-form";
import { MetaPixelPurchase } from "@/components/meta-pixel-purchase";
import { claimPendingLifetimePurchase } from "@/lib/billing/claim-pending-purchase";
import { verifyThankYouPayment } from "@/lib/billing/verify-thank-you-payment";
import { getCustomerAccess } from "@/lib/auth/access";
import { serverEnv } from "@/lib/env.server";
import { sendPurchaseEventFromPageRequest } from "@/lib/meta/capi";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

type ThankYouPageProps = {
  searchParams: Promise<{
    payment_id?: string;
    status?: string;
    email?: string;
  }>;
};

export default async function ThankYouPage({ searchParams }: ThankYouPageProps) {
  const { payment_id, status, email } = await searchParams;
  const verification = await verifyThankYouPayment({
    paymentId: payment_id,
    status,
    email,
  });

  if (!verification.ok) {
    redirect("/checkout");
  }

  // Backup Purchase CAPI with live UA/cookies — before any dashboard redirect.
  const requestHeaders = await headers();
  const appOrigin = serverEnv.appUrl.replace(/\/+$/, "");
  await sendPurchaseEventFromPageRequest({
    paymentId: verification.paymentId,
    email: verification.email,
    customer: verification.customer,
    eventSourceUrl: `${appOrigin}/thank-you`,
    requestHeaders,
  });

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email) {
    await claimPendingLifetimePurchase({
      userId: user.id,
      email: user.email,
    });

    const access = await getCustomerAccess(
      supabase as SupabaseClient<Database>,
      user.id,
    );

    if (access.hasLifetimeAccess) {
      redirect("/dashboard");
    }
  }

  const signupHref = verification.email
    ? `/signup?email=${encodeURIComponent(verification.email)}`
    : "/signup";

  return (
    <div className="relative min-h-screen bg-white [--landing-navy:#112437] [--landing-orange:#FC7B02] [--landing-orange-hover:#E36F02]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(252,123,2,0.12),transparent_55%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-10">
        <div className="mb-6 text-center">
          <p className="text-[13px] font-bold uppercase italic tracking-wide text-[var(--landing-orange-hover)]">
            Payment successful
          </p>
          <h1 className="mt-3 text-balance text-[30px] font-bold leading-[1.08] tracking-tight text-[var(--landing-navy)] sm:text-[36px]">
            Thank you. Your lifetime access is ready.
          </h1>
          <p className="mx-auto mt-4 max-w-md text-pretty text-[16px] font-medium leading-relaxed text-[#5B6B7C] sm:text-[17px]">
            Log in with the same email you used to pay and we&apos;ll unlock your
            dashboard instantly.
          </p>
        </div>

        <LoginForm
          nextPath="/dashboard"
          isPostPayment
          defaultEmail={verification.email ?? undefined}
        />

        <p className="mt-4 text-center text-[14px] text-[#5B6B7C]">
          No account yet?{" "}
          <Link
            href={signupHref}
            className="font-semibold text-[var(--landing-orange)] hover:underline"
          >
            Create one with the same email
          </Link>
        </p>

        <MetaPixelPurchase eventId={verification.paymentId} />
      </div>
    </div>
  );
}
