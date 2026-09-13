export function DashboardHeaderFallback() {
  return (
    <header className="hidden border-b border-border/80 bg-card/90 md:block">
      <div className="flex h-14 items-center px-6">
        <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
      </div>
    </header>
  );
}
