import Link from "next/link";

import { Button } from "@/components/ui/button";

export function LeadsEmptyState() {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center">
      <h3 className="text-lg font-semibold">No leads yet</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Install your AI counselor on your website to start capturing leads.
      </p>
      <Button asChild className="mt-4">
        <Link href="/dashboard/embed">Install AI Counselor</Link>
      </Button>
    </div>
  );
}
