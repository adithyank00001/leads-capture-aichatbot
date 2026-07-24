"use client";

import { useEffect, useMemo, useState } from "react";

import { getApiPath, publicConfig } from "@/lib/config";

type ApiResult = {
  ok: boolean;
  data?: unknown;
  error?: {
    code: string;
    message: string;
  };
};

function createSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `session-${Date.now()}`;
}

export function ApiTestPanel() {
  const [sessionId, setSessionId] = useState("");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [leadResult, setLeadResult] = useState<ApiResult | null>(null);
  const [chatResult, setChatResult] = useState<ApiResult | null>(null);
  const [aiResult, setAiResult] = useState<ApiResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSessionId(createSessionId());
  }, []);

  const sampleLeadBody = useMemo(
    () => ({
      botId: publicConfig.defaultBotId,
      sessionId,
      name: "Test Visitor",
      phone: "+15551234567",
      email: "visitor@example.com",
      pageUrl: "http://localhost:3000",
    }),
    [sessionId],
  );

  const sampleChatBody = useMemo(
    () => ({
      botId: publicConfig.defaultBotId,
      sessionId,
      message: "What are your opening hours?",
    }),
    [sessionId],
  );

  async function callApi(path: string, body: Record<string, unknown>) {
    const response = await fetch(getApiPath(path), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const result = (await response.json()) as ApiResult;

    if (!response.ok && !result.error) {
      return {
        ok: false,
        error: {
          code: "REQUEST_FAILED",
          message: `Request failed with status ${response.status}.`,
        },
      };
    }

    return result;
  }

  async function runLeadTest() {
    setLoadingAction("lead");
    setError(null);

    try {
      const result = await callApi("leads", sampleLeadBody);
      setLeadResult(result);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Lead API request failed.",
      );
    } finally {
      setLoadingAction(null);
    }
  }

  async function runChatTest() {
    setLoadingAction("chat");
    setError(null);

    try {
      const result = await callApi("chat", sampleChatBody);
      setChatResult(result);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Chat API request failed.",
      );
    } finally {
      setLoadingAction(null);
    }
  }

  async function runAiTest() {
    setLoadingAction("ai");
    setError(null);

    try {
      const result = await callApi("ai-test", {
        botId: publicConfig.defaultBotId,
        message: "What is the current offer?",
      });
      setAiResult(result);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "AI test request failed.",
      );
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <section className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-900">Phase 4 API test</h2>
      <p className="mt-2 text-sm leading-6 text-zinc-600">
        Step 1: save a lead. Step 2: send a chat message and get an AI answer.
        Step 3: test AI directly without saving a lead.
      </p>

      <p className="mt-3 text-sm text-zinc-600">
        Session ID:{" "}
        <code className="rounded bg-zinc-100 px-1.5 py-0.5">
          {sessionId || "Generating..."}
        </code>
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={runLeadTest}
          disabled={loadingAction !== null || !sessionId}
          className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loadingAction === "lead" ? "Saving lead..." : "Test lead API"}
        </button>

        <button
          type="button"
          onClick={runChatTest}
          disabled={loadingAction !== null || !sessionId}
          className="rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loadingAction === "chat" ? "Sending message..." : "Test chat + AI"}
        </button>

        <button
          type="button"
          onClick={runAiTest}
          disabled={loadingAction !== null}
          className="rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loadingAction === "ai" ? "Asking AI..." : "Test AI only"}
        </button>
      </div>

      {error ? (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {leadResult ? (
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-zinc-900">Lead API result</p>
          <pre className="overflow-x-auto rounded-xl bg-zinc-950 p-4 text-sm text-zinc-100">
            {JSON.stringify(leadResult, null, 2)}
          </pre>
        </div>
      ) : null}

      {chatResult ? (
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-zinc-900">Chat API result</p>
          {chatResult.ok &&
          chatResult.data &&
          typeof chatResult.data === "object" &&
          chatResult.data !== null &&
          "answer" in chatResult.data ? (
            <p className="mb-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              AI answer:{" "}
              <span className="font-medium">
                {String((chatResult.data as { answer: string }).answer)}
              </span>
            </p>
          ) : null}
          <pre className="overflow-x-auto rounded-xl bg-zinc-950 p-4 text-sm text-zinc-100">
            {JSON.stringify(chatResult, null, 2)}
          </pre>
        </div>
      ) : null}

      {aiResult ? (
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-zinc-900">AI-only test result</p>
          <pre className="overflow-x-auto rounded-xl bg-zinc-950 p-4 text-sm text-zinc-100">
            {JSON.stringify(aiResult, null, 2)}
          </pre>
        </div>
      ) : null}
    </section>
  );
}
