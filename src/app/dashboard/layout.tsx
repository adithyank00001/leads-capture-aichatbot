import { Suspense } from "react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardHeaderFallback } from "@/components/dashboard/dashboard-header-fallback";
import { DashboardMobileNav } from "@/components/dashboard/dashboard-mobile-nav";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { requireDashboardAuth } from "@/lib/auth/dashboard-session";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireDashboardAuth();

  return (
    <div className="min-h-screen bg-background">
      <DashboardMobileNav />
      <div className="flex min-h-[calc(100vh-57px)] md:min-h-screen">
        <DashboardSidebar />
        <div className="flex flex-1 flex-col">
          <Suspense fallback={<DashboardHeaderFallback />}>
            <DashboardHeader />
          </Suspense>
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:px-8 md:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
