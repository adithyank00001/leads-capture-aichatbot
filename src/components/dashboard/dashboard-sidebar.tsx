"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { DashboardLogoutButton } from "@/components/dashboard/logout-button";
import { BrandLogo } from "@/components/marketing/brand-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Overview", exact: true },
  { href: "/dashboard/settings", label: "Setup", exact: false },
  { href: "/dashboard/customize", label: "Customize chatbot", exact: false },
  { href: "/dashboard/website", label: "Website Knowledge", exact: false },
  { href: "/dashboard/embed", label: "Install Chatbot", exact: false },
  { href: "/dashboard/leads", label: "Leads", exact: false },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex md:flex-col">
      <div className="flex items-center border-b border-sidebar-border px-4 py-5">
        <BrandLogo href="/dashboard" size="md" />
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-2 border-t border-sidebar-border p-3">
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          asChild
        >
          <Link href="/dashboard/embed">Help</Link>
        </Button>
        <DashboardLogoutButton className="w-full justify-start" />
      </div>
    </aside>
  );
}
