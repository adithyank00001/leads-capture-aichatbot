"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { PageHeader } from "@/components/app-shell/page-header";
import { Surface } from "@/components/app-shell/surface";
import { LocationLeadsDailyLimitBadge } from "@/components/location-leads/location-leads-daily-limit-badge";
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
      <PageHeader
        title="Overview"
        description="Location based B2B lead generation software. Search by location and keyword, save leads, and export before data expires in 24 hours."
        actions={<LocationLeadsDailyLimitBadge />}
      />

      <Surface className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Ready to find leads?</p>
          <p className="text-sm text-muted-foreground">
            Start with a keyword and location. Results stay available for 24 hours.
          </p>
        </div>
        <Button asChild>
          <Link href="/location-leads/search">Start a lead search</Link>
        </Button>
      </Surface>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Recent searches
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/location-leads/history">View all</Link>
          </Button>
        </div>

        {searches.length === 0 ? (
          <Surface padding="sm">
            <p className="text-sm text-muted-foreground">
              No searches in the last 24 hours yet.
            </p>
          </Surface>
        ) : (
          <div className="space-y-2">
            {searches.map((search) => (
              <Link
                key={search.id}
                href={`/location-leads/search?searchId=${search.id}`}
                className="block rounded-xl border border-border/80 bg-card px-4 py-3.5 shadow-sm transition-colors hover:bg-muted/30"
              >
                <p className="font-medium text-foreground">{search.keyword}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {search.location_name} · {search.status} · {search.results_count}{" "}
                  leads
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
