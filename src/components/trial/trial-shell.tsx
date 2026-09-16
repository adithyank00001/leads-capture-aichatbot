"use client";

import { useCallback, useEffect, useState } from "react";

import {
  TrialExportLockedButton,
  TrialLockedFeatures,
} from "@/components/trial/trial-locked-features";
import {
  TrialResultsTable,
  type TrialLeadRow,
} from "@/components/trial/trial-results-table";
import { TrialSearchForm } from "@/components/trial/trial-search-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchJsonWithTimeout } from "@/lib/api/fetch-client";
import { getWhatsAppHref } from "@/lib/marketing/whatsapp";
import {
  TRIAL_EXPIRED_MESSAGE,
  TRIAL_PROCESSING_MESSAGE,
  TRIAL_PROCESSING_TITLE,
  TRIAL_SEARCH_USED_MESSAGE,
  TRIAL_UNLOCK_LIFETIME,
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
      <div className="min-h-screen overflow-x-hidden bg-background">
        <div className="mx-auto max-w-5xl px-4 py-16 text-sm text-muted-foreground">
          Loading trial…
        </div>
      </div>
    );
  }

  if (fatal) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-background">
        <div className="mx-auto max-w-lg space-y-4 px-4 py-16 text-center">
          <h1 className="text-xl font-semibold text-foreground">
            Trial unavailable
          </h1>
          <p className="text-sm text-muted-foreground">{fatal}</p>
          <Button asChild>
            <a
              href={getWhatsAppHref()}
              target="_blank"
              rel="noopener noreferrer"
            >
              {TRIAL_UNLOCK_LIFETIME}
            </a>
          </Button>
        </div>
      </div>
    );
  }

  const processing =
    searchStatus === "queued" || searchStatus === "submitted";

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <header className="border-b border-sidebar-border bg-sidebar text-sidebar-foreground shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4 md:py-4">
          <div className="min-w-0">
            <p className="text-sm font-medium uppercase tracking-wide text-sidebar-foreground/55 md:text-xs">
              growscalex
            </p>
            <h1 className="truncate text-xl font-semibold leading-snug md:text-lg">
              B2B lead generation trial
            </h1>
          </div>
          <Badge className="shrink-0 bg-sidebar-primary px-2.5 py-1 text-sm text-sidebar-primary-foreground hover:bg-sidebar-primary md:text-xs">
            Trial · 10 leads
          </Badge>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-5 px-4 py-5 md:grid-cols-[minmax(0,1fr)_240px] md:gap-6 md:py-8">
        <div className="min-w-0 space-y-5 md:space-y-6">
          {searchUsed ? (
            <Alert className="border-border/80 bg-card text-base md:text-sm">
              <AlertTitle className="text-base md:text-sm">
                Trial search used
              </AlertTitle>
              <AlertDescription className="text-base leading-relaxed md:text-sm">
                {TRIAL_SEARCH_USED_MESSAGE}
              </AlertDescription>
            </Alert>
          ) : null}

          {expiresAt ? (
            <p className="text-sm text-muted-foreground md:text-xs">
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
            <Alert className="border-border/80 bg-card text-base md:text-sm">
              <AlertTitle className="text-base md:text-sm">
                Search unavailable
              </AlertTitle>
              <AlertDescription className="text-base leading-relaxed md:text-sm">
                This trial cannot start a new search right now.
              </AlertDescription>
            </Alert>
          ) : null}

          {processing ? (
            <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm md:p-5">
              <div className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="mt-1 inline-block size-6 shrink-0 animate-spin rounded-full border-2 border-primary/20 border-t-primary md:mt-0.5 md:size-5"
                />
                <div>
                  <p className="text-lg font-semibold text-foreground md:text-base">
                    {TRIAL_PROCESSING_TITLE}
                  </p>
                  <p className="mt-1 text-base leading-relaxed text-muted-foreground md:text-sm">
                    {TRIAL_PROCESSING_MESSAGE}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {searchStatus === "failed" && searchError ? (
            <Alert variant="destructive" className="text-base md:text-sm">
              <AlertTitle className="text-base md:text-sm">
                Search failed
              </AlertTitle>
              <AlertDescription className="text-base leading-relaxed md:text-sm">
                {searchError} You can try once more.
              </AlertDescription>
            </Alert>
          ) : null}

          {searchMeta && searchStatus === "completed" ? (
            <div className="min-w-0 space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-foreground md:text-base">
                    Trial results
                  </h2>
                  <p className="text-base text-muted-foreground md:truncate md:text-sm">
                    {searchMeta.keyword} · {searchMeta.locationName}
                  </p>
                </div>
                <TrialExportLockedButton />
              </div>
              <TrialResultsTable leads={leads} />
            </div>
          ) : null}
        </div>

        <div className="min-w-0">
          <TrialLockedFeatures />
        </div>
      </main>
    </div>
  );
}
