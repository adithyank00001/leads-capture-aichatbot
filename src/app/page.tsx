import type { Metadata } from "next";

import { ApiTestPanel } from "@/components/api-test";
import { DatabaseTestPanel } from "@/components/database-test";
import { HealthCheckPanel } from "@/components/health-check";
import { SalesLandingPage } from "@/components/marketing/sales-landing-page";
import { publicConfig } from "@/lib/config";
import { getHasLifetimeAccessForMarketing } from "@/lib/marketing/access";

const isProduction = process.env.NODE_ENV === "production";

export const metadata: Metadata = {
  title: `${publicConfig.appName} — Turn Website Visitors Into Real Estate Leads`,
  description:
    "High-intent prospects visit your website but leave without contacting you. Our AI sales assistant captures their details before they leave, 24/7.",
};

export default async function HomePage() {
  const hasLifetimeAccess = await getHasLifetimeAccessForMarketing();

  return (
    <>
      <SalesLandingPage hasLifetimeAccess={hasLifetimeAccess} />

      {!isProduction ? (
        <div className="border-t border-border/60 bg-muted/30">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12">
            <HealthCheckPanel />
            <ApiTestPanel />
            <DatabaseTestPanel />
            <p className="text-sm text-muted-foreground">
              <a
                href="/demo-site/index.html"
                className="font-medium text-primary hover:underline"
              >
                Demo customer website
              </a>{" "}
              (development only)
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
