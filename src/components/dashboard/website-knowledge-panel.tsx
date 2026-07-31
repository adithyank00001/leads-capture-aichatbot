"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { PageLoadingSkeleton } from "@/components/dashboard/page-loading-skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { fetchJsonWithTimeout } from "@/lib/api/fetch-client";
import { getCustomerErrorMessage } from "@/lib/dashboard/customer-errors";
import { getWebsiteStatusCustomerLabel } from "@/lib/dashboard/setup-status";

type WebsiteBuildLog = {
  id: string;
  side: "nextjs" | "gas";
  step: string;
  status: string;
  message: string;
  createdAt: string;
};

type WebsitePageStatus = {
  id: string;
  pageUrl: string;
  pageTitle: string;
  status: "pending" | "processing" | "completed" | "failed";
  errorMessage: string | null;
  sortOrder: number;
};

type WebsiteStatus = {
  status:
    | "idle"
    | "discovering"
    | "processing"
    | "ready"
    | "partial"
    | "failed";
  websiteUrl: string;
  totalPages: number;
  completedPages: number;
  failedPages: number;
  currentPageIndex: number;
  errorMessage: string | null;
  refreshErrorMessage: string | null;
  lastProcessedAt: string | null;
  updatedAt: string | null;
  pages?: WebsitePageStatus[];
  logs?: WebsiteBuildLog[];
};

type StatusResponse = {
  ok: boolean;
  data?: WebsiteStatus;
  error?: {
    message: string;
  };
};

type BuildResponse = {
  ok: boolean;
  data?: {
    sourceId: string;
    status: string;
  };
  error?: {
    message: string;
  };
};

const POLL_INTERVAL_MS = 3000;

function getPageLabel(page: WebsitePageStatus) {
  const title =
    page.pageTitle?.trim() ||
    page.pageUrl.replace(/^https?:\/\//, "").replace(/\/$/, "") ||
    "Page";

  switch (page.status) {
    case "completed":
      return { title, label: "Saved" };
    case "failed":
      return { title, label: "Failed" };
    case "processing":
      return { title, label: "Processing" };
    default:
      return { title, label: "Waiting" };
  }
}

function getProgressLabel(status: WebsiteStatus) {
  const savedCount =
    status.pages?.filter((p) => p.status === "completed").length ??
    status.completedPages;

  if (status.status === "discovering") {
    return "Finding pages on your website…";
  }

  if (status.status === "processing") {
    if (status.totalPages > 0) {
      return `${savedCount} of ${status.totalPages} pages saved…`;
    }
    return "Building knowledge…";
  }

  if (status.status === "ready" || status.status === "partial") {
    if (status.totalPages > 0) {
      return `${savedCount} of ${status.totalPages} pages saved`;
    }
    return getWebsiteStatusCustomerLabel(status.status);
  }

  return getWebsiteStatusCustomerLabel(status.status);
}

const showTechnicalLogs = process.env.NODE_ENV === "development";

function getStatusBadgeVariant(
  status: WebsitePageStatus["status"],
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "completed":
      return "default";
    case "failed":
      return "destructive";
    case "processing":
      return "secondary";
    default:
      return "outline";
  }
}

export function WebsiteKnowledgePanel() {
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [status, setStatus] = useState<WebsiteStatus | null>(null);
  const [logs, setLogs] = useState<WebsiteBuildLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);
  const [retryingPageId, setRetryingPageId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const websiteUrlRef = useRef(websiteUrl);

  websiteUrlRef.current = websiteUrl;

  const loadStatus = useCallback(async () => {
    const { response, body: result } = await fetchJsonWithTimeout<StatusResponse>(
      "/api/dashboard/website/status",
    );

    if (!response.ok || !result.ok || !result.data) {
      throw new Error(result.error?.message ?? "Could not load website status.");
    }

    setStatus(result.data);
    setLogs(result.data.logs ?? []);

    if (!websiteUrlRef.current && result.data.websiteUrl) {
      setWebsiteUrl(result.data.websiteUrl);
    }

    return result.data;
  }, []);

  useEffect(() => {
    async function initialLoad() {
      try {
        await loadStatus();
      } catch (loadError) {
        setError(getCustomerErrorMessage(loadError));
      } finally {
        setLoading(false);
      }
    }

    void initialLoad();
  }, [loadStatus]);

  const shouldPoll =
    status?.status === "discovering" ||
    status?.status === "processing" ||
    status?.pages?.some((page) => page.status === "processing") ||
    retryingPageId !== null;

  useEffect(() => {
    if (!shouldPoll) {
      return;
    }

    const interval = window.setInterval(() => {
      void loadStatus()
        .then((data) => {
          if (retryingPageId) {
            const retriedPage = data.pages?.find((p) => p.id === retryingPageId);
            if (retriedPage && retriedPage.status !== "processing") {
              setRetryingPageId(null);
            }
          }
        })
        .catch(() => undefined);
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [loadStatus, retryingPageId, shouldPoll]);

  async function handleBuild() {
    setBuilding(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/dashboard/website/build", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ websiteUrl }),
      });

      const result = (await response.json()) as BuildResponse;

      if (!response.ok || !result.ok) {
        throw new Error(result.error?.message ?? "Could not start build.");
      }

      setMessage("Build started. This may take a few minutes.");
      toast.success("Knowledge build started");
      await loadStatus();
    } catch (buildError) {
      setError(getCustomerErrorMessage(buildError));
    } finally {
      setBuilding(false);
    }
  }

  async function handleRetry(pageId: string) {
    setRetryingPageId(pageId);
    setError(null);

    try {
      const response = await fetch(
        `/api/dashboard/website/pages/${pageId}/retry`,
        { method: "POST" },
      );
      const result = (await response.json()) as {
        ok: boolean;
        error?: { message: string };
      };

      if (!response.ok || !result.ok) {
        throw new Error(result.error?.message ?? "Could not retry page.");
      }

      setMessage("Retry started for failed page.");
      toast.success("Retry started");
      await loadStatus();
    } catch (retryError) {
      setRetryingPageId(null);
      setError(getCustomerErrorMessage(retryError));
    }
  }

  const isActive =
    status?.status === "discovering" || status?.status === "processing";
  const hasKnowledge =
    status?.status === "ready" || status?.status === "partial";
  const pages = status?.pages ?? [];

  if (loading) {
    return <PageLoadingSkeleton variant="website" />;
  }

  return (
    <Card className="shadow-md ring-primary/5">
      <CardHeader>
        <CardTitle className="text-2xl">Website information</CardTitle>
        <CardDescription>
          We scan your website and automatically teach the chatbot about your
          business.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="website-url">Homepage URL</Label>
          <Input
            id="website-url"
            type="url"
            value={websiteUrl}
            onChange={(event) => setWebsiteUrl(event.target.value)}
            placeholder="https://yourbusiness.com"
            disabled={building || isActive}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            onClick={() => void handleBuild()}
            disabled={building || isActive || !websiteUrl.trim()}
          >
            {building
              ? "Starting..."
              : hasKnowledge
                ? "Refresh Knowledge"
                : "Build Knowledge"}
          </Button>
          {status ? (
            <Badge variant="secondary">{getProgressLabel(status)}</Badge>
          ) : null}
        </div>

        {status?.status === "partial" && status.refreshErrorMessage ? (
          <Alert>
            <AlertDescription className="text-amber-900">
              {status.refreshErrorMessage}
            </AlertDescription>
          </Alert>
        ) : null}

        {status?.errorMessage ? (
          <Alert variant="destructive">
            <AlertDescription>{status.errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        {message ? (
          <Alert>
            <AlertDescription className="text-emerald-700">{message}</AlertDescription>
          </Alert>
        ) : null}
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {pages.length > 0 ? (
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="mb-3 text-sm font-semibold">Pages</p>
            <ul className="space-y-2">
              {pages.map((page) => {
                const { title, label } = getPageLabel(page);
                const showRetry =
                  page.status === "failed" &&
                  !isActive &&
                  retryingPageId !== page.id;

                return (
                  <li
                    key={page.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">{title}</p>
                      <p className="text-muted-foreground">
                        {label}
                        {page.errorMessage ? ` — ${page.errorMessage}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusBadgeVariant(page.status)}>
                        {label}
                      </Badge>
                      {showRetry ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => void handleRetry(page.id)}
                        >
                          Retry
                        </Button>
                      ) : null}
                      {retryingPageId === page.id || page.status === "processing" ? (
                        <span className="text-xs text-muted-foreground">Working...</span>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        {logs.length > 0 && showTechnicalLogs ? (
          <>
            <Separator />
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="mb-2 text-sm font-semibold">Build logs</p>
              <div className="max-h-64 space-y-2 overflow-y-auto text-xs text-muted-foreground">
                {[...logs].reverse().map((log) => (
                  <div key={log.id} className="rounded-lg border bg-card px-2 py-1">
                    <p className="font-medium text-foreground">
                      [{log.side}] {log.step} — {log.status}
                    </p>
                    <p>{log.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
