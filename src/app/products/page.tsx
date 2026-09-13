import Link from "next/link";

import { DashboardLogoutButton } from "@/components/dashboard/logout-button";
import { BrandLogo } from "@/components/marketing/brand-logo";
import { requireAnyProductAuth } from "@/lib/auth/dashboard-session";

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
        "Location based B2B lead generation software. Search by location and keyword, then export and save leads.",
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
                className="rounded-xl border-2 border-border/80 bg-card/70 p-5 text-left shadow-sm"
                aria-disabled="true"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="block text-base font-semibold text-foreground/70 sm:text-lg">
                    {product.title}
                  </span>
                  <span className="shrink-0 rounded-md border border-border bg-muted px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Locked
                  </span>
                </div>
                <span className="mt-2 block text-sm text-muted-foreground/90">
                  {product.description}
                </span>
                <span className="mt-3 block border-t border-border/70 pt-3 text-xs font-medium text-muted-foreground">
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
