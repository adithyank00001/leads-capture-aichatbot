import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/dashboard/login-form";
import { claimPendingLifetimePurchase } from "@/lib/billing/claim-pending-purchase";
import { getCustomerAccess } from "@/lib/auth/access";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

type LoginPageProps = {
  searchParams: Promise<{
    next?: string;
    error?: string;
    paid?: string;
    email?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next, error, paid, email } = await searchParams;
  const isPostPayment = paid === "1";
  const nextPath = next ?? (isPostPayment ? "/dashboard" : undefined);

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email) {
    if (isPostPayment) {
      await claimPendingLifetimePurchase({
        userId: user.id,
        email: user.email,
      });
    }

    const access = await getCustomerAccess(
      supabase as SupabaseClient<Database>,
      user.id,
    );

    if (access.hasLifetimeAccess) {
      redirect("/dashboard");
    }
  }

  return (
    <div className="relative flex min-h-screen w-full flex-1 bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.52_0.19_252/0.12),transparent_55%)]" />
      <div className="relative mx-auto flex w-full min-h-screen max-w-md flex-col justify-center px-4 py-10 sm:px-6">
        <LoginForm
          nextPath={nextPath}
          authError={error}
          isPostPayment={isPostPayment}
          defaultEmail={email}
        />
        <p className="mt-4 text-center text-sm text-muted-foreground">
          No account?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
