"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon } from "lucide-react";

import { DashboardLogoutButton } from "@/components/dashboard/logout-button";
import { BrandLogo } from "@/components/marketing/brand-logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet";
import { locationLeadsNavItems } from "@/lib/location-leads/nav";
import { cn } from "@/lib/utils";

export function LocationLeadsMobileNav() {
  const pathname = usePathname();

  return (
    <div className="flex items-center justify-between border-b border-sidebar-border bg-sidebar px-4 py-3 text-sidebar-foreground md:hidden">
      <BrandLogo href="/location-leads" size="md" />
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="border-sidebar-border bg-transparent"
          >
            <MenuIcon className="size-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-72 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground"
        >
          <SheetHeader className="border-b border-sidebar-border px-4 py-4">
            <BrandLogo href="/location-leads" size="md" />
            <p className="text-left text-xs text-sidebar-foreground/70">
              Location B2B leads
            </p>
          </SheetHeader>
          <nav className="flex flex-col gap-1 p-3">
            {locationLeadsNavItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

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
        </SheetContent>
      </Sheet>
    </div>
  );
}
