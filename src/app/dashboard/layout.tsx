import Link from "next/link";
import { redirect } from "next/navigation";

import { DashboardLogoutButton } from "@/components/dashboard/logout-button";
import { ensureCustomerOnboarding } from "@/lib/dashboard/onboarding";
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

  await ensureCustomerOnboarding(supabase, {
    userId: user.id,
    email: user.email ?? "",
  });

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <header className="border-b border-zinc-300 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Customer dashboard
            </p>
            <p className="text-sm text-zinc-700">{user.email}</p>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/dashboard/settings">Settings</Link>
            <Link href="/dashboard/embed">Embed</Link>
            <Link href="/dashboard/leads">Leads</Link>
            <DashboardLogoutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
