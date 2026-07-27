"use client";

import { useCallback, useEffect, useState } from "react";

type WebsiteBuildLog = {
  id: string;
  side: "nextjs" | "gas";
  step: string;
  status: string;
  message: string;
  createdAt: string;
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

function getStatusLabel(status: WebsiteStatus) {
  switch (status.status) {
    case "discovering":
      return "Discovering pages on your website...";
    case "processing": {
      const current = Math.min(
        status.currentPageIndex + 1,
        Math.max(status.totalPages, 1),
      );
      if (status.totalPages > 0) {
        return `Processing page ${current} of ${status.totalPages}...`;
      }
      return "Processing website pages...";
    }
    case "ready":
      return "Knowledge ready";
    case "partial":
      return "Ready with warnings";
    case "failed":
      return "Build failed";
    default:
      return "Not built yet";
  }
}

export function WebsiteKnowledgePanel() {
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [status, setStatus] = useState<WebsiteStatus | null>(null);
  const [logs, setLogs] = useState<WebsiteBuildLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    const response = await fetch("/api/dashboard/website/status");
    const result = (await response.json()) as StatusResponse;

    if (!response.ok || !result.ok || !result.data) {
      throw new Error(result.error?.message ?? "Could not load website status.");
    }

    setStatus(result.data);
    setLogs(result.data.logs ?? []);

    if (!websiteUrl && result.data.websiteUrl) {
      setWebsiteUrl(result.data.websiteUrl);
    }

    return result.data;
  }, [websiteUrl]);

  useEffect(() => {
    async function initialLoad() {
      try {
        await loadStatus();
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load website status.",
        );
      } finally {
        setLoading(false);
      }
    }

    void initialLoad();
  }, [loadStatus]);

  useEffect(() => {
    if (!status || (status.status !== "discovering" && status.status !== "processing")) {
      return;
    }

    const interval = window.setInterval(() => {
      void loadStatus().catch(() => undefined);
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [loadStatus, status]);

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
      await loadStatus();
    } catch (buildError) {
      setError(
        buildError instanceof Error
          ? buildError.message
          : "Could not start build.",
      );
    } finally {
      setBuilding(false);
    }
  }

  const isActive =
    status?.status === "discovering" || status?.status === "processing";
  const hasKnowledge =
    status?.status === "ready" || status?.status === "partial";

  if (loading) {
    return <p className="text-sm text-zinc-600">Loading website knowledge...</p>;
  }

  return (
    <div className="space-y-6 rounded-xl border border-zinc-300 bg-white p-6 shadow-sm">
      <div>
        <h1 className="text-2xl font-semibold">Website Knowledge</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Enter your homepage URL. We will read your public website pages and use
          that information to help the chatbot answer visitor questions.
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium" htmlFor="website-url">
          Homepage URL
        </label>
        <input
          id="website-url"
          type="url"
          value={websiteUrl}
          onChange={(event) => setWebsiteUrl(event.target.value)}
          placeholder="https://yourbusiness.com"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          disabled={building || isActive}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => void handleBuild()}
          disabled={building || isActive || !websiteUrl.trim()}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {building
            ? "Starting..."
            : hasKnowledge
              ? "Refresh Knowledge"
              : "Build Knowledge"}
        </button>
        {status ? (
          <p className="text-sm text-zinc-700">{getStatusLabel(status)}</p>
        ) : null}
      </div>

      {status?.status === "partial" && status.refreshErrorMessage ? (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {status.refreshErrorMessage}
        </p>
      ) : null}

      {status?.errorMessage ? (
        <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {status.errorMessage}
        </p>
      ) : null}

      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      {status && status.totalPages > 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
          <p>Pages completed: {status.completedPages}</p>
          <p>Pages failed: {status.failedPages}</p>
          <p>Total selected pages: {status.totalPages}</p>
        </div>
      ) : null}

      {logs.length > 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3">
          <p className="mb-2 text-sm font-medium text-zinc-800">Build logs</p>
          <div className="max-h-64 space-y-2 overflow-y-auto text-xs text-zinc-700">
            {[...logs].reverse().map((log) => (
              <div key={log.id} className="rounded border border-zinc-200 bg-white px-2 py-1">
                <p className="font-medium">
                  [{log.side}] {log.step} — {log.status}
                </p>
                <p className="text-zinc-600">{log.message}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
