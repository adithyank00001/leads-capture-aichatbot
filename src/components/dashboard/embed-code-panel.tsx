"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { EmbedTroubleshooting } from "@/components/dashboard/embed-troubleshooting";
import { PageLoadingSkeleton } from "@/components/dashboard/page-loading-skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getEmbedCopiedKey, getPublicAppOrigin } from "@/lib/config";
import { fetchJsonWithTimeout } from "@/lib/api/fetch-client";
import { getCustomerErrorMessage } from "@/lib/dashboard/customer-errors";
import {
  embedPasteGuideNote,
  embedPasteGuideSteps,
  embedSetupLoadFailed,
} from "@/lib/dashboard/embed-help";

type BotResponse = {
  ok: boolean;
  data?: {
    bot: {
      bot_id: string;
    };
    allowedDomains: string[];
  };
  error?: {
    message: string;
  };
};

export function EmbedCodePanel() {
  const [botId, setBotId] = useState("");
  const [allowedDomains, setAllowedDomains] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBot() {
      try {
        const { response, body: result } =
          await fetchJsonWithTimeout<BotResponse>("/api/dashboard/bot");

        if (!response.ok || !result.ok || !result.data) {
          throw new Error(result.error?.message ?? "Could not load bot.");
        }

        setBotId(result.data.bot.bot_id);
        setAllowedDomains(result.data.allowedDomains ?? []);
      } catch (loadError) {
        setError(getCustomerErrorMessage(loadError));
      } finally {
        setLoading(false);
      }
    }

    loadBot();
  }, []);

  const embedCode = `<script
  src="${getPublicAppOrigin()}/widget.js"
  data-bot-id="${botId}"
  async
></script>`;

  const primaryDomain = allowedDomains[0] ?? "";
  const hasDomain = primaryDomain.length > 0;

  async function handleCopy() {
    if (!botId) {
      return;
    }

    try {
      await navigator.clipboard.writeText(embedCode);
      localStorage.setItem(getEmbedCopiedKey(botId), "1");
      setCopied(true);
      toast.success("Script copied");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      toast.error("Could not copy script. Please copy it manually.");
    }
  }

  if (loading) {
    return <PageLoadingSkeleton variant="embed" />;
  }

  return (
    <Card className="shadow-md ring-primary/5">
      <CardHeader>
        <CardTitle className="text-2xl">Install your AI Counselor</CardTitle>
        <CardDescription>
          Copy the script and paste it on your website.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!hasDomain ? (
          <Alert>
            <AlertTitle>Save your website domain first</AlertTitle>
            <AlertDescription>
              Add your website domain in Setup before installing the AI counselor.{" "}
              <Link
                href="/dashboard/settings"
                className="font-medium text-primary underline"
              >
                Go to Setup
              </Link>
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-2">
          <h2 className="text-sm font-semibold">How to install</h2>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Copy the script below.</li>
            <li>Paste it before &lt;/body&gt; on your website.</li>
            <li>Open your website and test the AI counselor.</li>
          </ol>
          <p className="text-sm text-muted-foreground">{embedPasteGuideNote}</p>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>{embedSetupLoadFailed.title}</AlertTitle>
            <AlertDescription>
              {getCustomerErrorMessage(new Error(error))}
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm">
              {hasDomain ? (
                <p>
                  <span className="font-medium">Website domain:</span>{" "}
                  {primaryDomain}
                </p>
              ) : null}
              <p className="text-muted-foreground">
                Status: {hasDomain ? "Ready to install" : "Add domain in Setup"}
              </p>
            </div>
            {botId ? (
              <Button
                type="button"
                onClick={handleCopy}
                size="sm"
                disabled={!hasDomain}
              >
                {copied ? "Copied!" : "Copy code"}
              </Button>
            ) : null}
          </div>
          <pre className="overflow-x-auto rounded-lg border bg-sidebar p-4 text-xs text-sidebar-foreground">
            {botId ? embedCode : "Loading..."}
          </pre>
        </div>

        {botId ? (
          <Button variant="outline" asChild>
            <a href={`/embed/${botId}`} target="_blank" rel="noreferrer">
              Open AI Counselor preview
            </a>
          </Button>
        ) : null}

        <EmbedTroubleshooting />
      </CardContent>
    </Card>
  );
}
