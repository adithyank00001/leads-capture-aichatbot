"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
import { fetchJsonWithTimeout } from "@/lib/api/fetch-client";
import { getEmbedCopiedKey } from "@/lib/config";
import { getCustomerErrorMessage } from "@/lib/dashboard/customer-errors";
import {
  getChatbotReadinessLabel,
  getContinueSetupHref,
  getSetupSteps,
  type WebsiteBuildStatus,
} from "@/lib/dashboard/setup-status";

type KnowledgeFields = {
  description: string;
  location: string;
  services: string;
  pricing_notes: string;
  current_offer: string;
  opening_hours: string;
  contact_method: string;
  extra_notes: string;
};

type BotResponse = {
  ok: boolean;
  data?: {
    bot: {
      bot_id: string;
      business_name: string;
    };
    knowledge: KnowledgeFields;
    allowedDomains: string[];
    usage: {
      monthlyMessageLimit: number;
      messagesUsedThisPeriod: number;
      leadsCapturedThisPeriod: number;
    } | null;
  };
  error?: { message: string };
};

type WebsiteStatusResponse = {
  ok: boolean;
  data?: {
    status: WebsiteBuildStatus;
    completedPages: number;
  };
};

type LeadsResponse = {
  ok: boolean;
  data?: {
    leads: Array<{ id: string }>;
  };
};

type DashboardOverviewProps = {
  userEmail: string;
};

type BotUsage = NonNullable<BotResponse["data"]>["usage"];

export function DashboardOverview({ userEmail }: DashboardOverviewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [botId, setBotId] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [knowledge, setKnowledge] = useState<KnowledgeFields | null>(null);
  const [allowedDomains, setAllowedDomains] = useState<string[]>([]);
  const [usage, setUsage] = useState<BotUsage>(null);
  const [websiteStatus, setWebsiteStatus] = useState<WebsiteBuildStatus>(null);
  const [completedPages, setCompletedPages] = useState(0);
  const [leadCount, setLeadCount] = useState(0);
  const [embedCopied, setEmbedCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSecondaryData() {
      try {
        const [websiteResult, leadsResult] = await Promise.all([
          fetchJsonWithTimeout<WebsiteStatusResponse>(
            "/api/dashboard/website/status",
          ),
          fetchJsonWithTimeout<LeadsResponse>("/api/dashboard/leads"),
        ]);

        if (cancelled) {
          return;
        }

        if (
          websiteResult.response.ok &&
          websiteResult.body.ok &&
          websiteResult.body.data
        ) {
          setWebsiteStatus(websiteResult.body.data.status);
          setCompletedPages(websiteResult.body.data.completedPages ?? 0);
        }

        if (
          leadsResult.response.ok &&
          leadsResult.body.ok &&
          leadsResult.body.data
        ) {
          setLeadCount(leadsResult.body.data.leads.length);
        }
      } catch {
        // Secondary stats can load later without blocking the dashboard.
      }
    }

    async function loadOverview() {
      try {
        const botResult = await fetchJsonWithTimeout<BotResponse>(
          "/api/dashboard/bot",
        );

        if (cancelled) {
          return;
        }

        if (!botResult.response.ok || !botResult.body.ok || !botResult.body.data) {
          throw new Error(
            botResult.body.error?.message ?? "Could not load dashboard.",
          );
        }

        const botData = botResult.body.data;

        setBotId(botData.bot.bot_id);
        setBusinessName(botData.bot.business_name ?? "");
        setKnowledge(botData.knowledge);
        setAllowedDomains(botData.allowedDomains ?? []);
        setUsage(botData.usage);

        const copied =
          localStorage.getItem(getEmbedCopiedKey(botData.bot.bot_id)) === "1";
        setEmbedCopied(copied);
        setLoading(false);

        void loadSecondaryData();
      } catch (loadError) {
        if (!cancelled) {
          setError(getCustomerErrorMessage(loadError));
          setLoading(false);
        }
      }
    }

    void loadOverview();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <PageLoadingSkeleton variant="overview" />;
  }

  if (error || !knowledge) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error ?? "Could not load dashboard."}</AlertDescription>
      </Alert>
    );
  }

  const setupInput = {
    businessName,
    knowledge: {
      description: knowledge.description,
      location: knowledge.location,
      services: knowledge.services,
      pricing_notes: knowledge.pricing_notes,
      current_offer: knowledge.current_offer,
      opening_hours: knowledge.opening_hours,
      contact_method: knowledge.contact_method,
      extra_notes: knowledge.extra_notes,
    },
    allowedDomains,
    websiteStatus,
    embedCopied,
    completedPages,
  };

  const steps = getSetupSteps(setupInput);
  const continueHref = getContinueSetupHref(steps);
  const readinessLabel = getChatbotReadinessLabel(setupInput);
  const displayName = userEmail.split("@")[0] || "there";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome, {displayName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{userEmail}</p>
      </div>

      <Card className="shadow-md ring-primary/5">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Your chatbot setup</CardTitle>
              <CardDescription>
                Complete these steps to get your chatbot ready for your website.
              </CardDescription>
            </div>
            <Badge variant="secondary">Chatbot status: {readinessLabel}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2">
            {steps.map((step) => (
              <li
                key={step.id}
                className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm"
              >
                <span>
                  {step.complete ? "✓" : "○"} {step.label}
                </span>
                {!step.complete ? (
                  <Button variant="link" className="h-auto p-0" asChild>
                    <Link href={step.href}>Go</Link>
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
          <Button asChild>
            <Link href={continueHref}>Continue setup</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Leads this month</CardDescription>
            <CardTitle className="text-2xl">
              {usage?.leadsCapturedThisPeriod ?? leadCount}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Messages used</CardDescription>
            <CardTitle className="text-2xl">
              {usage
                ? `${usage.messagesUsedThisPeriod} / ${usage.monthlyMessageLimit}`
                : "—"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Knowledge pages</CardDescription>
            <CardTitle className="text-2xl">{completedPages}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Business</CardDescription>
            <CardTitle className="text-lg truncate">
              {businessName || "Not set"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
