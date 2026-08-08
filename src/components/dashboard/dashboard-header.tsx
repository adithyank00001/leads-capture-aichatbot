import { requireDashboardAuth } from "@/lib/auth/dashboard-session";

export async function DashboardHeader() {
  const { user } = await requireDashboardAuth();

  return (
    <header className="hidden border-b bg-card px-6 py-4 md:block">
      <p className="text-sm text-muted-foreground">{user.email}</p>
    </header>
  );
}
