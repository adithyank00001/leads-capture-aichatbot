import { ApiTestPanel } from "@/components/api-test";
import { DatabaseTestPanel } from "@/components/database-test";
import { HealthCheckPanel } from "@/components/health-check";
import { LandingHero } from "@/components/marketing/landing-hero";

const isProduction = process.env.NODE_ENV === "production";

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.52_0.19_252/0.15),transparent_50%)]" />
      <main className="relative mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12">
        <LandingHero />

        {!isProduction ? (
          <>
            <HealthCheckPanel />
            <ApiTestPanel />
            <DatabaseTestPanel />
            <p className="text-sm text-muted-foreground">
              <a href="/demo-site/index.html" className="font-medium text-primary hover:underline">
                Demo customer website
              </a>
              {" "}
              (development only)
            </p>
          </>
        ) : null}
      </main>
    </div>
  );
}
