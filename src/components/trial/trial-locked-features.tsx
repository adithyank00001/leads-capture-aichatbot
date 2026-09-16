"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TRIAL_EXPORT_LOCKED_MESSAGE } from "@/lib/trial/constants";

const LOCKED_FEATURES = [
  { label: "Saved leads", hint: "Save forever after purchase" },
  { label: "Search history", hint: "Full history unlocked with lifetime" },
  { label: "Export CSV", hint: "Download all fields after purchase" },
] as const;

export function TrialLockedFeatures() {
  return (
    <aside className="space-y-4 rounded-xl border border-border/80 bg-card p-4">
      <div>
        <h2 className="text-sm font-semibold">More features</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Locked on trial. Buy lifetime access to unlock.
        </p>
      </div>
      <ul className="space-y-2">
        {LOCKED_FEATURES.map((item) => (
          <li
            key={item.label}
            className="flex items-start justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2"
          >
            <div>
              <div className="text-sm font-medium">{item.label}</div>
              <div className="text-xs text-muted-foreground">{item.hint}</div>
            </div>
            <Badge variant="secondary">Locked</Badge>
          </li>
        ))}
      </ul>
      <Button asChild className="w-full" size="sm">
        <Link href="/checkout">Unlock lifetime access</Link>
      </Button>
    </aside>
  );
}

export function TrialExportLockedButton() {
  return (
    <div className="space-y-1">
      <Button type="button" variant="outline" disabled>
        Export CSV
      </Button>
      <p className="text-xs text-muted-foreground">{TRIAL_EXPORT_LOCKED_MESSAGE}</p>
    </div>
  );
}
