import { Suspense } from "react";

import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { PageLoadingSkeleton } from "@/components/dashboard/page-loading-skeleton";
import { requireDashboardBundle } from "@/lib/auth/dashboard-session";
import { loadDashboardOverviewData } from "@/lib/dashboard/overview-data";

async function DashboardOverviewContent() {
  const bundle = await requireDashboardBundle();
  const initialData = await loadDashboardOverviewData(bundle);

  return (
    <DashboardOverview
      userEmail={bundle.user.email ?? ""}
      initialData={initialData}
    />
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<PageLoadingSkeleton variant="overview" />}>
      <DashboardOverviewContent />
    </Suspense>
  );
}
