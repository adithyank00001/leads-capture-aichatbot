"use client";

import { useEffect, useState } from "react";

import { LocationLeadsCreditsBadge } from "@/components/location-leads/location-leads-credits-badge";
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

export function LocationLeadsSettingsPanel() {
  const [credits, setCredits] = useState<{
    limit: number;
    used: number;
    remaining: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { body } = await fetchJsonWithTimeout<CreditsResponse>(
          "/api/location-leads/credits",
        );
        if (!cancelled && body.ok && body.data) {
          setCredits(body.data);
        }
      } catch {
        // Keep empty state.
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Lead credit balance for this product.
        </p>
      </div>

      <LocationLeadsCreditsBadge />

      <div className="rounded-xl border border-border p-4 space-y-2">
        <p className="font-medium">{LEAD_CREDITS_BADGE_LABEL}</p>
        {credits ? (
          <>
            <p className="text-sm text-muted-foreground">
              Used: {credits.used.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">
              Remaining: {credits.remaining.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">
              Limit: {credits.limit.toLocaleString()}
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Loading credits…</p>
        )}
      </div>
    </div>
  );
}
