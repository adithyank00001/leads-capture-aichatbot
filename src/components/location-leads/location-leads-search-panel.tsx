"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { LocationLeadsSearchForm } from "@/components/location-leads/location-leads-search-form";
import {
  LocationLeadsResultsTable,
  type MapsLeadRow,
} from "@/components/location-leads/location-leads-results-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchJsonWithTimeout } from "@/lib/api/fetch-client";
import {
  DATA_EXPIRES_BADGE,
  getProcessingStatusLabel,
  type MapsSearchStatus,
} from "@/lib/location-leads/constants";

type SearchPayload = {
  id: string;
  keyword: string;
  location_name: string;
  depth: number;
  status: MapsSearchStatus;
  results_count: number;
  error_message: string | null;
};

type SearchResponse = {
  ok: boolean;
  data?: { search: SearchPayload };
};

type LeadsResponse = {
  ok: boolean;
  data?: {
    search: SearchPayload;
    leads: MapsLeadRow[];
  };
};

export function LocationLeadsSearchPanel({
  initialSearchId,
}: {
  initialSearchId?: string;
}) {
  const [activeSearchId, setActiveSearchId] = useState(initialSearchId ?? "");
  const [search, setSearch] = useState<SearchPayload | null>(null);
  const [leads, setLeads] = useState<MapsLeadRow[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);

  const loadLeads = useCallback(async (searchId: string) => {
    setLoadingLeads(true);
    try {
      const { body } = await fetchJsonWithTimeout<LeadsResponse>(
        `/api/location-leads/searches/${searchId}/leads`,
      );
      if (body.ok && body.data) {
        setSearch(body.data.search);
        setLeads(body.data.leads);
      }
    } finally {
      setLoadingLeads(false);
    }
  }, []);

  useEffect(() => {
    if (!activeSearchId) {
      return;
    }

    let cancelled = false;
    let timer: number | null = null;

    async function poll() {
      try {
        const { body } = await fetchJsonWithTimeout<SearchResponse>(
          `/api/location-leads/searches/${activeSearchId}`,
        );
        if (cancelled || !body.ok || !body.data?.search) {
          return;
        }

        const next = body.data.search;
        setSearch(next);

        if (next.status === "completed") {
          await loadLeads(activeSearchId);
          return;
        }

        if (next.status === "failed") {
          setLeads([]);
          return;
        }

        timer = window.setTimeout(() => {
          void poll();
        }, 3000);
      } catch {
        timer = window.setTimeout(() => {
          void poll();
        }, 5000);
      }
    }

    void poll();

    return () => {
      cancelled = true;
      if (timer !== null) {
        window.clearTimeout(timer);
      }
    };
  }, [activeSearchId, loadLeads]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Search leads</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Run a B2B database search by keyword and location. Results expire in
          24 hours.
        </p>
      </div>

      <LocationLeadsSearchForm
        onSearchCreated={(searchId) => {
          setActiveSearchId(searchId);
          setSearch(null);
          setLeads([]);
        }}
      />

      {search ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              {getProcessingStatusLabel(search.status)}
            </Badge>
            {search.status === "completed" ? (
              <Badge variant="outline">{DATA_EXPIRES_BADGE}</Badge>
            ) : null}
            <p className="text-sm text-muted-foreground">
              {search.keyword} · {search.location_name} · depth {search.depth}
            </p>
          </div>

          {search.status === "queued" || search.status === "submitted" ? (
            <p className="rounded-xl border border-border px-4 py-8 text-center text-sm text-muted-foreground">
              Processing… this can take a few minutes. You can leave this page
              and return from History.
            </p>
          ) : null}

          {search.status === "failed" ? (
            <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-6 text-sm text-destructive">
              {search.error_message ?? "Search failed. Credits were refunded."}
            </p>
          ) : null}

          {search.status === "completed" ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                  {loadingLeads
                    ? "Loading leads…"
                    : `${leads.length} leads found`}
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a href={`/api/location-leads/export?search_id=${search.id}`}>
                    Export CSV
                  </a>
                </Button>
              </div>
              <LocationLeadsResultsTable
                leads={leads}
                onLeadUpdated={(updated) => {
                  setLeads((prev) =>
                    prev.map((lead) =>
                      lead.id === updated.id ? { ...lead, ...updated } : lead,
                    ),
                  );
                }}
              />
              <Button variant="ghost" size="sm" asChild>
                <Link href="/location-leads/history">View all recent searches</Link>
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
