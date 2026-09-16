"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getWhatsAppHref } from "@/lib/marketing/whatsapp";
import {
  TRIAL_EXPORT_LOCKED_MESSAGE,
  TRIAL_UNLOCK_LIFETIME,
} from "@/lib/trial/constants";

const LOCKED_FEATURES = [
  { label: "Saved leads", hint: "Save forever after purchase" },
  { label: "Search history", hint: "Full history unlocked with lifetime" },
  { label: "Export CSV", hint: "Download all fields after purchase" },
  { label: "Other features", hint: "Full product tools unlocked after purchase" },
] as const;

export function TrialLockedFeatures() {
  return (
    <aside className="space-y-4 rounded-xl border border-border/80 bg-card p-4 shadow-sm md:p-4">
      <div className="rounded-lg bg-sidebar px-3 py-3 text-sidebar-foreground md:py-2">
        <h2 className="text-base font-semibold md:text-sm">More features</h2>
        <p className="mt-1 text-sm leading-relaxed text-sidebar-foreground/70 md:mt-0.5 md:text-xs">
          Locked on trial. Buy lifetime access to unlock.
        </p>
      </div>
      <ul className="space-y-2.5 md:space-y-2">
        {LOCKED_FEATURES.map((item) => (
          <li
            key={item.label}
            className="flex items-start justify-between gap-3 rounded-lg border border-border/60 bg-secondary/60 px-3 py-3 md:gap-2 md:py-2"
          >
            <div className="min-w-0">
              <div className="text-base font-medium text-foreground md:text-sm">
                {item.label}
              </div>
              <div className="mt-0.5 text-sm leading-snug text-muted-foreground md:text-xs">
                {item.hint}
              </div>
            </div>
            <Badge variant="secondary" className="shrink-0 text-sm md:text-xs">
              Locked
            </Badge>
          </li>
        ))}
      </ul>
      <Button asChild className="h-11 w-full text-base md:h-8 md:text-sm">
        <a
          href={getWhatsAppHref()}
          target="_blank"
          rel="noopener noreferrer"
        >
          {TRIAL_UNLOCK_LIFETIME}
        </a>
      </Button>
    </aside>
  );
}

export function TrialExportLockedButton() {
  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant="outline"
        disabled
        className="h-11 w-full text-base md:h-8 md:w-auto md:text-sm"
      >
        Export CSV
      </Button>
      <p className="max-w-none text-sm leading-snug text-muted-foreground md:max-w-[16rem] md:text-xs">
        {TRIAL_EXPORT_LOCKED_MESSAGE}
      </p>
    </div>
  );
}
