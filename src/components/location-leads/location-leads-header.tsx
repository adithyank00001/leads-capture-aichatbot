import { LocationLeadsCreditsBadge } from "@/components/location-leads/location-leads-credits-badge";
import { requireDashboardAuth } from "@/lib/auth/dashboard-session";

export async function LocationLeadsHeader() {
  const { user } = await requireDashboardAuth();

  return (
    <header className="hidden items-center justify-between gap-4 border-b bg-card px-6 py-4 md:flex">
      <p className="truncate text-sm text-muted-foreground">{user.email}</p>
      <LocationLeadsCreditsBadge />
    </header>
  );
}
