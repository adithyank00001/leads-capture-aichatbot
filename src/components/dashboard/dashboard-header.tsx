import { requireDashboardAuth } from "@/lib/auth/dashboard-session";

export async function DashboardHeader() {
  const { user } = await requireDashboardAuth();

  return (
    <header className="hidden border-b border-border/80 bg-card/90 backdrop-blur-sm md:block">
      <div className="flex h-14 items-center justify-between gap-4 px-6">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            AI Sales Agent
          </p>
          <p className="truncate text-sm text-foreground/80">{user.email}</p>
        </div>
      </div>
    </header>
  );
}
