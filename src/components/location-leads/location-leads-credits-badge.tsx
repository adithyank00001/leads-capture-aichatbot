"use client";

import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
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
    <Badge variant="outline" className="h-auto max-w-full whitespace-normal px-2.5 py-1">
      <span className="font-medium">{LEAD_CREDITS_BADGE_LABEL}</span>
      {remaining !== null ? (
        <span className="text-muted-foreground">
          {" "}
          · {remaining.toLocaleString()} / {limit.toLocaleString()} left
        </span>
      ) : null}
    </Badge>
  );
}
