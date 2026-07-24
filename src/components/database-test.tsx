"use client";

import { useState } from "react";

import { getApiPath } from "@/lib/config";

type DbTestResponse =
  | {
      ok: true;
      data: {
        lead: Record<string, unknown>;
        messages: Array<Record<string, unknown>>;
        message: string;
      };
    }
  | { ok: false; error: { code: string; message: string } };

export function DatabaseTestPanel() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DbTestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runDatabaseTest() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(getApiPath("db-test"), {
        method: "POST",
      });

      const body = (await response.json()) as DbTestResponse;

      if (!response.ok) {
        setError(`Request failed with status ${response.status}`);
      }

      setResult(body);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not reach the database test route.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-900">Phase 2 test</h2>
      <p className="mt-2 text-sm leading-6 text-zinc-600">
        This button saves one test lead and two test messages in Supabase, then
        reads them back. It only works in development and only after you add
        your Supabase keys to <code className="rounded bg-zinc-100 px-1.5 py-0.5">.env.local</code>.
      </p>

      <button
        type="button"
        onClick={runDatabaseTest}
        disabled={loading}
        className="mt-5 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Testing database..." : "Run database test"}
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
