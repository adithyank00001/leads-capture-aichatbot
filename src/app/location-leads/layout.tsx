import { Suspense } from "react";

import { LocationLeadsCreditsBadge } from "@/components/location-leads/location-leads-credits-badge";
import { LocationLeadsHeader } from "@/components/location-leads/location-leads-header";
import { LocationLeadsMobileNav } from "@/components/location-leads/location-leads-mobile-nav";
import { LocationLeadsSidebar } from "@/components/location-leads/location-leads-sidebar";
import { requireDashboardAuth } from "@/lib/auth/dashboard-session";

export default async function LocationLeadsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireDashboardAuth();

  return (
    <div className="min-h-screen bg-background">
      <LocationLeadsMobileNav />
      <div className="flex min-h-[calc(100vh-57px)] md:min-h-screen">
        <LocationLeadsSidebar />
        <div className="flex flex-1 flex-col">
          <Suspense
            fallback={
              <header className="hidden border-b bg-card px-6 py-4 md:block">
                <div className="h-5 w-48 animate-pulse rounded bg-muted" />
              </header>
            }
          >
            <LocationLeadsHeader />
          </Suspense>
          <div className="border-b px-4 py-3 md:hidden">
            <LocationLeadsCreditsBadge />
          </div>
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:px-8 md:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
