import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <DashboardOverview userEmail={user?.email ?? ""} />;
}
