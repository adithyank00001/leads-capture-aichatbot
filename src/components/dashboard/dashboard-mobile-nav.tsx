"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon } from "lucide-react";

import { DashboardLogoutButton } from "@/components/dashboard/logout-button";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { publicConfig } from "@/lib/config";

const navItems = [
  { href: "/dashboard", label: "Overview", exact: true },
  { href: "/dashboard/settings", label: "Setup", exact: false },
  { href: "/dashboard/customize", label: "Customize chatbot", exact: false },
  { href: "/dashboard/website", label: "Website Knowledge", exact: false },
  { href: "/dashboard/embed", label: "Install Chatbot", exact: false },
  { href: "/dashboard/leads", label: "Leads", exact: false },
];

export function DashboardMobileNav() {
  const pathname = usePathname();

  return (
    <div className="flex items-center justify-between border-b border-sidebar-border bg-sidebar px-4 py-3 text-sidebar-foreground md:hidden">
      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
          LA
        </div>
        <span className="font-semibold">{publicConfig.appName}</span>
      </div>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="border-sidebar-border bg-transparent">
            <MenuIcon className="size-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="border-b px-4 py-4">
            <SheetTitle>{publicConfig.appName}</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 p-3">
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
                      : "hover:bg-muted",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="space-y-2 border-t p-3">
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/dashboard/embed">Help</Link>
            </Button>
            <DashboardLogoutButton className="w-full justify-start" />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
