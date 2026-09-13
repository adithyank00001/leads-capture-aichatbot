"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { DashboardLogoutButton } from "@/components/dashboard/logout-button";
import { BrandLogo } from "@/components/marketing/brand-logo";
import { Button } from "@/components/ui/button";
import { locationLeadsNavItems } from "@/lib/location-leads/nav";
import { cn } from "@/lib/utils";

export function LocationLeadsSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex md:flex-col">
      <div className="flex flex-col gap-1 border-b border-sidebar-border px-4 py-5">
        <BrandLogo href="/location-leads" size="md" />
        <p className="text-xs text-sidebar-foreground/70">
          Location B2B leads
        </p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {locationLeadsNavItems.map((item) => {
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
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
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
          className="w-full justify-start text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          asChild
        >
          <Link href="/products">Switch product</Link>
        </Button>
        <DashboardLogoutButton className="w-full justify-start" />
      </div>
    </aside>
  );
}
