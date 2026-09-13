"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { PageHeader } from "@/components/app-shell/page-header";
import { Surface } from "@/components/app-shell/surface";
import { Button } from "@/components/ui/button";
import { fetchJsonWithTimeout } from "@/lib/api/fetch-client";
import type { MapsSearchStatus } from "@/lib/location-leads/constants";

type SearchRow = {
  id: string;
  keyword: string;
  location_name: string;
  status: MapsSearchStatus;
  results_count: number;
  created_at: string;
};

type HistoryResponse = {
  ok: boolean;
  data?: { searches: SearchRow[] };
};

export function LocationLeadsExportPanel() {
  const [searches, setSearches] = useState<SearchRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { body } = await fetchJsonWithTimeout<HistoryResponse>(
          "/api/location-leads/searches",
        );
        if (!cancelled && body.ok && body.data) {
          setSearches(
            body.data.searches.filter((search) => search.status === "completed"),
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
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
        title="Export"
        description="Download CSV files for completed searches or all currently saved leads. Export before the 24-hour expiry."
      />

      <Surface className="space-y-3">
        <div>
          <p className="font-medium">Saved leads</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Export every lead you marked as saved (still within 24 hours).
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href="/api/location-leads/export?saved=1">Download saved CSV</a>
        </Button>
      </Surface>

      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Completed searches
        </p>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : null}
        {!loading && searches.length === 0 ? (
          <Surface padding="sm">
            <p className="text-sm text-muted-foreground">
              No completed searches in the last 24 hours.{" "}
              <Link href="/location-leads/search" className="text-primary hover:underline">
                Start a search
              </Link>
            </p>
          </Surface>
        ) : null}
        {searches.map((search) => (
          <Surface
            key={search.id}
            padding="sm"
            className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium">{search.keyword}</p>
              <p className="text-sm text-muted-foreground">
                {search.location_name} · {search.results_count} leads
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href={`/api/location-leads/export?search_id=${search.id}`}>
                Download CSV
              </a>
            </Button>
          </Surface>
        ))}
      </div>
    </div>
  );
}
