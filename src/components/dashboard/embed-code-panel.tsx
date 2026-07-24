"use client";

import { useEffect, useState } from "react";

import { publicConfig } from "@/lib/config";

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

export function EmbedCodePanel() {
  const [botId, setBotId] = useState("");
  const [error, setError] = useState<string | null>(null);

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

  return (
    <section className="space-y-4 border border-zinc-300 bg-white p-4">
      <h1 className="text-xl font-semibold">Embed code</h1>
      <p className="text-sm text-zinc-600">
        Paste this script into your website.
      </p>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <p className="text-sm">
        Bot ID: <code>{botId || "..."}</code>
      </p>
      <pre className="overflow-x-auto border border-zinc-300 bg-zinc-50 p-3 text-xs">
        {botId ? embedCode : "Loading..."}
      </pre>
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
