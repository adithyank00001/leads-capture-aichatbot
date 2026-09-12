"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { LocationLeadsCreditsBadge } from "@/components/location-leads/location-leads-credits-badge";
import { Button } from "@/components/ui/button";
import { fetchJsonWithTimeout } from "@/lib/api/fetch-client";
import type { MapsSearchStatus } from "@/lib/location-leads/constants";

type SearchRow = {
  id: string;
  keyword: string;
  location_name: string;
  status: MapsSearchStatus;
  results_count: number;
};

type HistoryResponse = {
  ok: boolean;
  data?: { searches: SearchRow[] };
};

export function LocationLeadsOverviewPanel() {
  const [searches, setSearches] = useState<SearchRow[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { body } = await fetchJsonWithTimeout<HistoryResponse>(
          "/api/location-leads/searches",
        );
        if (!cancelled && body.ok && body.data) {
          setSearches(body.data.searches.slice(0, 5));
        }
      } catch {
        // Overview stays usable without history.
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Location based B2B lead generation. Search the business database,
          save leads, and export before data expires in 24 hours.
        </p>
        <LocationLeadsCreditsBadge />
      </div>

      <Button asChild>
        <Link href="/location-leads/search">Start a lead search</Link>
      </Button>

      <div className="space-y-3">
        <h2 className="text-lg font-medium">Recent searches</h2>
        {searches.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No searches in the last 24 hours yet.
          </p>
        ) : (
          searches.map((search) => (
            <Link
              key={search.id}
              href={`/location-leads/search?searchId=${search.id}`}
              className="block rounded-xl border border-border p-4 transition-colors hover:bg-muted/40"
            >
              <p className="font-medium">{search.keyword}</p>
              <p className="text-sm text-muted-foreground">
                {search.location_name} · {search.status} · {search.results_count}{" "}
                leads
              </p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
