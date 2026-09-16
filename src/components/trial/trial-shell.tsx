"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { TrialExportLockedButton, TrialLockedFeatures } from "@/components/trial/trial-locked-features";
import {
  TrialResultsTable,
  type TrialLeadRow,
} from "@/components/trial/trial-results-table";
import { TrialSearchForm } from "@/components/trial/trial-search-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchJsonWithTimeout } from "@/lib/api/fetch-client";
import {
  TRIAL_EXPIRED_MESSAGE,
  TRIAL_SEARCH_USED_MESSAGE,
} from "@/lib/trial/constants";

type TrialStatusResponse = {
  ok: boolean;
  data?: {
    trial: {
      status: string;
      searchUsed: boolean;
      expiresAt: string | null;
      canSearch: boolean;
    };
    search: {
      id: string;
      keyword: string;
      locationName: string;
      status: string;
      resultsCount: number;
      errorMessage: string | null;
    } | null;
    leads: TrialLeadRow[];
  };
  error?: { message?: string; code?: string };
};

type SearchPollResponse = {
  ok: boolean;
  data?: {
    search: {
      id: string;
      status: string;
      error_message: string | null;
      results_count: number;
      keyword: string;
      location_name: string;
    };
  };
};

type TrialShellProps = {
  token: string;
};

export function TrialShell({ token }: TrialShellProps) {
  const [loading, setLoading] = useState(true);
  const [fatal, setFatal] = useState<string | null>(null);
  const [canSearch, setCanSearch] = useState(false);
  const [searchUsed, setSearchUsed] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [activeSearchId, setActiveSearchId] = useState("");
  const [searchStatus, setSearchStatus] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchMeta, setSearchMeta] = useState<{
    keyword: string;
    locationName: string;
  } | null>(null);
  const [leads, setLeads] = useState<TrialLeadRow[]>([]);

  const loadStatus = useCallback(async () => {
    const { response, body } = await fetchJsonWithTimeout<TrialStatusResponse>(
      `/api/trial/${encodeURIComponent(token)}`,
    );

    if (response.status === 410 || body.error?.code === "TRIAL_EXPIRED") {
      setFatal(body.error?.message ?? TRIAL_EXPIRED_MESSAGE);
      return;
    }
    if (response.status === 404 || !body.ok || !body.data) {
      setFatal(body.error?.message ?? "This trial link is not valid.");
      return;
    }

    const { trial, search, leads: nextLeads } = body.data;
    setCanSearch(trial.canSearch);
    setSearchUsed(trial.searchUsed);
    setExpiresAt(trial.expiresAt);
    setLeads(nextLeads ?? []);

    if (search) {
      setActiveSearchId(search.id);
      setSearchStatus(search.status);
      setSearchError(search.errorMessage);
      setSearchMeta({
        keyword: search.keyword,
        locationName: search.locationName,
      });
    }
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadStatus();
      } catch {
        if (!cancelled) {
          setFatal("Could not load this trial link.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadStatus]);

  useEffect(() => {
    if (!activeSearchId) {
      return;
    }
    if (searchStatus === "completed" || searchStatus === "failed") {
      return;
    }

    let cancelled = false;
    let timer: number | null = null;

    async function poll() {
      try {
        const { body } = await fetchJsonWithTimeout<SearchPollResponse>(
          `/api/trial/${encodeURIComponent(token)}/searches/${activeSearchId}`,
        );
        if (cancelled || !body.ok || !body.data?.search) {
          return;
        }

        const next = body.data.search;
        setSearchStatus(next.status);
        setSearchError(next.error_message);
        setSearchMeta({
          keyword: next.keyword,
          locationName: next.location_name,
        });

        if (next.status === "completed") {
          await loadStatus();
          return;
        }

        if (next.status === "failed") {
          setCanSearch(true);
          return;
        }

        timer = window.setTimeout(poll, 2500);
      } catch {
        timer = window.setTimeout(poll, 4000);
      }
    }

    void poll();

    return () => {
      cancelled = true;
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [activeSearchId, searchStatus, token, loadStatus]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-sm text-muted-foreground">
        Loading trial…
      </div>
    );
  }

  if (fatal) {
    return (
      <div className="mx-auto max-w-lg space-y-4 px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Trial unavailable</h1>
        <p className="text-sm text-muted-foreground">{fatal}</p>
        <Button asChild>
          <Link href="/checkout">Get lifetime access</Link>
        </Button>
      </div>
    );
  }

  const processing =
    searchStatus === "queued" || searchStatus === "submitted";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/80 bg-card/90">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              growscalex
            </p>
            <h1 className="text-lg font-semibold">B2B lead generation trial</h1>
          </div>
          <Badge variant="secondary">Trial · 10 leads</Badge>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-6 md:grid-cols-[1fr_240px] md:py-8">
        <div className="space-y-6">
          {searchUsed ? (
            <Alert>
              <AlertTitle>Trial search used</AlertTitle>
              <AlertDescription>{TRIAL_SEARCH_USED_MESSAGE}</AlertDescription>
            </Alert>
          ) : null}

          {expiresAt ? (
            <p className="text-xs text-muted-foreground">
              Results available until {new Date(expiresAt).toLocaleString()}.
            </p>
          ) : null}

          {canSearch ? (
            <TrialSearchForm
              token={token}
              disabled={processing}
              onSearchCreated={(id) => {
                setActiveSearchId(id);
                setSearchStatus("queued");
                setSearchError(null);
                setCanSearch(false);
              }}
            />
          ) : !searchUsed && !processing ? (
            <Alert>
              <AlertTitle>Search unavailable</AlertTitle>
              <AlertDescription>
                This trial cannot start a new search right now.
              </AlertDescription>
            </Alert>
          ) : null}

          {processing ? (
            <Alert>
              <AlertTitle>Processing…</AlertTitle>
              <AlertDescription>
                Finding leads for your trial. This usually takes a short time.
              </AlertDescription>
            </Alert>
          ) : null}

          {searchStatus === "failed" && searchError ? (
            <Alert variant="destructive">
              <AlertTitle>Search failed</AlertTitle>
              <AlertDescription>
                {searchError} You can try once more.
              </AlertDescription>
            </Alert>
          ) : null}

          {searchMeta && searchStatus === "completed" ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">Trial results</h2>
                  <p className="text-sm text-muted-foreground">
                    {searchMeta.keyword} · {searchMeta.locationName}
                  </p>
                </div>
                <TrialExportLockedButton />
              </div>
              <TrialResultsTable leads={leads} />
            </div>
          ) : null}
        </div>

        <TrialLockedFeatures />
      </main>
    </div>
  );
}
