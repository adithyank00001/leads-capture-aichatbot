import { CompleteProfileForm } from "@/components/account/complete-profile-form";
import { BrandLogo } from "@/components/marketing/brand-logo";
import { DashboardLogoutButton } from "@/components/dashboard/logout-button";
import { requireLoggedInAuth } from "@/lib/auth/dashboard-session";
import { redirect } from "next/navigation";
import { PAID_HOME_PATH } from "@/lib/auth/oauth";

export default async function CompleteProfilePage() {
  const auth = await requireLoggedInAuth();

  if (auth.access.profileCompleted) {
    redirect(
      auth.access.hasLifetimeAccess || auth.access.hasMapsAccess
        ? PAID_HOME_PATH
        : "/checkout",
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-1 bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.52_0.19_252/0.12),transparent_55%)]" />
      <div className="relative mx-auto flex w-full min-h-screen max-w-md flex-col justify-center px-4 py-10 sm:px-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <BrandLogo href="/complete-profile" size="md" />
          <DashboardLogoutButton className="border-border text-foreground hover:bg-muted hover:text-foreground" />
        </div>
        <CompleteProfileForm
          defaultName={auth.access.fullName ?? ""}
          defaultMobile={auth.access.mobilePhone ?? ""}
        />
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Signed in as {auth.user.email}. You must finish this step to continue.
        </p>
      </div>
    </div>
  );
}
