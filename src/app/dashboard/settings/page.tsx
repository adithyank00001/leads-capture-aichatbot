import { Suspense } from "react";

import { BotSettingsForm } from "@/components/dashboard/bot-settings-form";
import { PageLoadingSkeleton } from "@/components/dashboard/page-loading-skeleton";
import { requireDashboardBundle } from "@/lib/auth/dashboard-session";
import { mapDashboardBundleToSettings } from "@/lib/dashboard/overview-data";

async function SettingsContent() {
  const bundle = await requireDashboardBundle();
  const initialData = mapDashboardBundleToSettings(bundle);

  return <BotSettingsForm initialData={initialData} />;
}

export default function DashboardSettingsPage() {
  return (
    <Suspense fallback={<PageLoadingSkeleton variant="settings" />}>
      <SettingsContent />
    </Suspense>
  );
}
