"use client";

import { useCallback, useEffect, useState } from "react";

import { fetchJsonWithTimeout } from "@/lib/api/fetch-client";
import {
  DAILY_LEADS_LIMIT_BADGE_LABEL,
  MAPS_DAILY_LEADS_LIMIT,
} from "@/lib/location-leads/constants";

type CreditsResponse = {
  ok: boolean;
  data?: {
    dailyLimit: number;
    dailyUsed: number;
    dailyRemaining: number;
  };
};

/** Shown only on the Search page — daily IST lead budget. */
export function LocationLeadsDailyLimitBadge() {
  const [dailyUsed, setDailyUsed] = useState<number | null>(null);
  const [dailyLimit, setDailyLimit] = useState(MAPS_DAILY_LEADS_LIMIT);

  const load = useCallback(async () => {
    try {
      const { body } = await fetchJsonWithTimeout<CreditsResponse>(
        "/api/location-leads/credits",
      );
      if (body.ok && body.data) {
        setDailyUsed(body.data.dailyUsed);
        setDailyLimit(body.data.dailyLimit);
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
      <span className="font-semibold text-foreground">
        {DAILY_LEADS_LIMIT_BADGE_LABEL}
      </span>
      {dailyUsed !== null ? (
        <span className="ml-1.5 tabular-nums text-muted-foreground">
          · {dailyUsed.toLocaleString()} / {dailyLimit.toLocaleString()} used
          today
        </span>
      ) : null}
    </div>
  );
}
