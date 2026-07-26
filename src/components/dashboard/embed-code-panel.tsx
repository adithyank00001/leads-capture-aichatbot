"use client";

import { useEffect, useState } from "react";

import { publicConfig } from "@/lib/config";
import {
  embedPasteGuideNote,
  embedPasteGuideSteps,
  embedSetupLoadFailed,
  embedTroubleshootingEntries,
  type EmbedHelpEntry,
} from "@/lib/dashboard/embed-help";

type BotResponse = {
  ok: boolean;
  data?: {
    bot: {
      bot_id: string;
    };
  };
  error?: {
    message: string;
  };
};

function HelpEntryCard({ entry }: { entry: EmbedHelpEntry }) {
  return (
    <div className="space-y-2 border border-zinc-200 bg-zinc-50 p-3">
      <h3 className="text-sm font-semibold">{entry.title}</h3>
      <p className="text-sm text-zinc-700">
        <span className="font-medium">Issue: </span>
        {entry.issue}
      </p>
      <p className="text-sm text-zinc-700">
        <span className="font-medium">What to do: </span>
        {entry.action}
      </p>
      <p className="text-sm text-zinc-600">
        <span className="font-medium">Still stuck? </span>
        {entry.support}
      </p>
    </div>
  );
}

export function EmbedCodePanel() {
  const [botId, setBotId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadBot() {
      try {
        const response = await fetch("/api/dashboard/bot");
        const result = (await response.json()) as BotResponse;

        if (!response.ok || !result.ok || !result.data) {
          throw new Error(result.error?.message ?? "Could not load bot.");
        }

        setBotId(result.data.bot.bot_id);
      } catch (loadError) {
        setError(
          loadError instanceof Error ? loadError.message : "Could not load bot.",
        );
      }
    }

    loadBot();
  }, []);

  const embedCode = `<script
  src="${publicConfig.appUrl}/widget.js"
  data-bot-id="${botId}"
  async
></script>`;

  async function handleCopy() {
    if (!botId) {
      return;
    }

    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="space-y-6 border border-zinc-300 bg-white p-4">
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Add the chatbot to your website</h1>
        <p className="text-sm text-zinc-600">
          Copy the script below and paste it on your website.
        </p>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">How to install</h2>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-zinc-700">
          {embedPasteGuideSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="text-sm text-zinc-600">{embedPasteGuideNote}</p>
      </div>

      {error ? (
        <div className="space-y-2 border border-red-300 bg-red-50 p-3">
          <p className="text-sm font-semibold text-red-800">
            {embedSetupLoadFailed.title}
          </p>
          <p className="text-sm text-red-800">
            <span className="font-medium">Issue: </span>
            {embedSetupLoadFailed.issue}
            {error ? ` (${error})` : null}
          </p>
          <p className="text-sm text-red-800">
            <span className="font-medium">What to do: </span>
            {embedSetupLoadFailed.action}
          </p>
          <p className="text-sm text-red-800">
            <span className="font-medium">Still stuck? </span>
            {embedSetupLoadFailed.support}
          </p>
        </div>
      ) : null}

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Your script</h2>
          {botId ? (
            <button
              type="button"
              onClick={handleCopy}
              className="border border-zinc-900 bg-zinc-900 px-3 py-1.5 text-sm text-white"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          ) : null}
        </div>
        <pre className="overflow-x-auto border border-zinc-300 bg-zinc-50 p-3 text-xs">
          {botId ? embedCode : "Loading..."}
        </pre>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Troubleshooting</h2>
        <p className="text-sm text-zinc-600">
          If the chatbot is not showing on your website, check the common issues
          below.
        </p>
        <div className="space-y-3">
          {embedTroubleshootingEntries.map((entry) => (
            <HelpEntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      </div>

      {botId ? (
        <a
          href={`/embed/${botId}`}
          target="_blank"
          rel="noreferrer"
          className="inline-block text-sm underline"
        >
          Open chatbot test page
        </a>
      ) : null}
    </section>
  );
}
