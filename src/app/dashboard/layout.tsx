import { redirect } from "next/navigation";

import { DashboardMobileNav } from "@/components/dashboard/dashboard-mobile-nav";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardMobileNav />
      <div className="flex min-h-[calc(100vh-57px)] md:min-h-screen">
        <DashboardSidebar />
        <div className="flex flex-1 flex-col">
          <header className="hidden border-b bg-card px-6 py-4 md:block">
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </header>
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:px-8 md:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
