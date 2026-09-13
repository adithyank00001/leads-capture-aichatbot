"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { PageHeader } from "@/components/app-shell/page-header";
import { Surface } from "@/components/app-shell/surface";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchJsonWithTimeout } from "@/lib/api/fetch-client";
import {
  DATA_EXPIRES_BADGE,
  getProcessingStatusLabel,
  type MapsSearchStatus,
} from "@/lib/location-leads/constants";

type SearchRow = {
  id: string;
  keyword: string;
  location_name: string;
  depth: number;
  status: MapsSearchStatus;
  results_count: number;
  created_at: string;
};

type HistoryResponse = {
  ok: boolean;
  data?: { searches: SearchRow[] };
};

export function LocationLeadsHistoryPanel() {
  const [searches, setSearches] = useState<SearchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { body } = await fetchJsonWithTimeout<HistoryResponse>(
          "/api/location-leads/searches",
        );
        if (!cancelled) {
          if (body.ok && body.data) {
            setSearches(body.data.searches);
          } else {
            setError("Could not load search history.");
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load history.");
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
        title="Search history"
        description="Searches from the last 24 hours. Older data is removed automatically."
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {!loading && !error && searches.length === 0 ? (
        <Surface>
          <p className="text-center text-sm text-muted-foreground">
            No recent searches yet.{" "}
            <Link href="/location-leads/search" className="text-primary hover:underline">
              Start a search
            </Link>
          </p>
        </Surface>
      ) : null}

      <div className="space-y-2">
        {searches.map((search) => (
          <Surface
            key={search.id}
            padding="sm"
            className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="space-y-1.5">
              <p className="font-medium">{search.keyword}</p>
              <p className="text-sm text-muted-foreground">
                {search.location_name} · depth {search.depth} ·{" "}
                {search.results_count} leads
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {getProcessingStatusLabel(search.status)}
                </Badge>
                {search.status === "completed" ? (
                  <Badge variant="outline">{DATA_EXPIRES_BADGE}</Badge>
                ) : null}
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/location-leads/search?searchId=${search.id}`}>
                Open
              </Link>
            </Button>
          </Surface>
        ))}
      </div>
    </div>
  );
}
