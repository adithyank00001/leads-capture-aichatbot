import Link from "next/link";

import { Button } from "@/components/ui/button";
import { publicConfig } from "@/lib/config";

export function LandingHero() {
  return (
    <header className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
          LA
        </div>
        <span className="text-lg font-semibold tracking-tight">
          {publicConfig.appName}
        </span>
      </div>
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          {publicConfig.productTagline}
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Add an AI chatbot to your website, capture visitor details, and manage
          leads from one simple dashboard.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link href="/signup">Start free</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/login">Login</Link>
        </Button>
      </div>
    </header>
  );
}
