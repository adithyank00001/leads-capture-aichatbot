"use client";

import { useState } from "react";

import { getApiPath, publicConfig } from "@/lib/config";

type HealthData = {
  status: string;
  version: string;
  app: string;
  defaultBotId: string;
  timestamp: string;
  services: {
    api: string;
    supabase: string;
    ai: string;
  };
};

type HealthResponse =
  | { ok: true; data: HealthData }
  | { ok: false; error: { code: string; message: string } };

export function HealthCheckPanel() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runHealthCheck() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(getApiPath("health"), {
        method: "GET",
        cache: "no-store",
      });

      const body = (await response.json()) as HealthResponse;

      if (!response.ok) {
        setError(`Request failed with status ${response.status}`);
      }

      setResult(body);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not reach the API.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-900">Phase 1 test</h2>
      <p className="mt-2 text-sm leading-6 text-zinc-600">
        This button calls{" "}
        <code className="rounded bg-zinc-100 px-1.5 py-0.5">
          {getApiPath("health")}
        </code>{" "}
        on the same Next.js app. If it works, the frontend can talk to our API.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-zinc-600">
        <span>
          Default bot ID:{" "}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5">
            {publicConfig.defaultBotId}
          </code>
        </span>
        <span>
          App URL:{" "}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5">
            {publicConfig.appUrl}
          </code>
        </span>
      </div>

      <button
        type="button"
        onClick={runHealthCheck}
        disabled={loading}
        className="mt-5 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Checking..." : "Run health check"}
      </button>

      {error ? (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {result ? (
        <pre className="mt-4 overflow-x-auto rounded-xl bg-zinc-950 p-4 text-sm text-zinc-100">
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : null}
    </section>
  );
}
