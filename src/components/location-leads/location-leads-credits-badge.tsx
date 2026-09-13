"use client";

import { useCallback, useEffect, useState } from "react";

import { fetchJsonWithTimeout } from "@/lib/api/fetch-client";
import { LEAD_CREDITS_BADGE_LABEL } from "@/lib/location-leads/constants";

type CreditsResponse = {
  ok: boolean;
  data?: {
    limit: number;
    used: number;
    remaining: number;
  };
};

export function LocationLeadsCreditsBadge() {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [limit, setLimit] = useState(100_000);

  const load = useCallback(async () => {
    try {
      const { body } = await fetchJsonWithTimeout<CreditsResponse>(
        "/api/location-leads/credits",
      );
      if (body.ok && body.data) {
        setRemaining(body.data.remaining);
        setLimit(body.data.limit);
      }
    } catch {
      // Badge stays on fallback label.
    }
  }, []);

  useEffect(() => {
    void load();

    function onCreditsChanged() {
      void load();
    }

    window.addEventListener("location-leads-credits-changed", onCreditsChanged);
    return () => {
      window.removeEventListener(
        "location-leads-credits-changed",
        onCreditsChanged,
      );
    };
  }, [load]);

  return (
    <div className="inline-flex max-w-full items-center rounded-lg border border-border/80 bg-card px-3 py-1.5 text-xs shadow-sm">
      <span className="font-semibold text-foreground">{LEAD_CREDITS_BADGE_LABEL}</span>
      {remaining !== null ? (
        <span className="ml-1.5 tabular-nums text-muted-foreground">
          · {remaining.toLocaleString()} / {limit.toLocaleString()} left
        </span>
      ) : null}
    </div>
  );
}
