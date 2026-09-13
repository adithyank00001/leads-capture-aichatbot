import Link from "next/link";

import { DashboardLogoutButton } from "@/components/dashboard/logout-button";
import { BrandLogo } from "@/components/marketing/brand-logo";
import { requireAnyProductAuth } from "@/lib/auth/dashboard-session";
import { cn } from "@/lib/utils";

export default async function ProductsPage() {
  const auth = await requireAnyProductAuth();
  const { hasLifetimeAccess, hasMapsAccess } = auth.access;

  const products = [
    {
      href: "/dashboard",
      title: "AI sales agent for lead generation (works on your website)",
      description:
        "Your website chatbot that chats with visitors and captures leads.",
      unlocked: hasLifetimeAccess,
      lockedHint:
        "Locked. Buy Product 1 (lifetime access) to open this dashboard.",
    },
    {
      href: "/location-leads",
      title: "Location based B2B lead generation software",
      description:
        "Find local businesses by city and keyword, then export phone numbers and websites.",
      unlocked: hasMapsAccess,
      lockedHint:
        "Locked. After you pay for Product 2, ask us to unlock your email.",
    },
  ] as const;

  return (
    <div className="relative flex min-h-screen w-full flex-1 bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.52_0.19_252/0.12),transparent_55%)]" />
      <div className="relative mx-auto flex w-full max-w-2xl flex-col px-4 py-10 sm:px-6">
        <div className="mb-8 flex items-center justify-between gap-4">
          <BrandLogo href="/products" size="md" />
          <DashboardLogoutButton className="border-border text-foreground hover:bg-muted hover:text-foreground" />
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Choose a product
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Open the product you paid for. Locked products stay closed until access
          is added for your email.
        </p>

        <div className="mt-8 flex flex-col gap-4">
          {products.map((product) =>
            product.unlocked ? (
              <Link
                key={product.href}
                href={product.href}
                className="rounded-xl border border-border bg-card p-5 text-left shadow-sm transition-colors hover:border-primary hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span className="block text-base font-semibold text-foreground sm:text-lg">
                  {product.title}
                </span>
                <span className="mt-2 block text-sm text-muted-foreground">
                  {product.description}
                </span>
                <span className="mt-3 inline-block text-xs font-medium text-primary">
                  Open product →
                </span>
              </Link>
            ) : (
              <div
                key={product.href}
                className={cn(
                  "rounded-xl border border-dashed border-border bg-muted/30 p-5 text-left opacity-80",
                )}
                aria-disabled="true"
              >
                <span className="block text-base font-semibold text-foreground sm:text-lg">
                  {product.title}
                </span>
                <span className="mt-2 block text-sm text-muted-foreground">
                  {product.description}
                </span>
                <span className="mt-3 inline-block text-xs font-medium text-muted-foreground">
                  {product.lockedHint}
                </span>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
