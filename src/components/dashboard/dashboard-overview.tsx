"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
import { getEmbedCopiedKey } from "@/lib/config";
import type { DashboardOverviewData } from "@/lib/dashboard/overview-data";
import {
  getChatbotReadinessLabel,
  getContinueSetupHref,
  getSetupSteps,
} from "@/lib/dashboard/setup-status";

type DashboardOverviewProps = {
  userEmail: string;
  initialData: DashboardOverviewData;
};

export function DashboardOverview({
  userEmail,
  initialData,
}: DashboardOverviewProps) {
  const [embedCopied, setEmbedCopied] = useState(false);

  useEffect(() => {
    const copied =
      localStorage.getItem(getEmbedCopiedKey(initialData.botId)) === "1";
    setEmbedCopied(copied);
  }, [initialData.botId]);

  const setupInput = {
    businessName: initialData.businessName,
    knowledge: initialData.knowledge,
    allowedDomains: initialData.allowedDomains,
    websiteStatus: initialData.websiteStatus,
    embedCopied,
    completedPages: initialData.completedPages,
  };

  const steps = getSetupSteps(setupInput);
  const continueHref = getContinueSetupHref(steps);
  const readinessLabel = getChatbotReadinessLabel(setupInput);
  const displayName = userEmail.split("@")[0] || "there";

  function formatMonitorDate(value: string | null) {
    if (!value) {
      return "—";
    }

    return new Date(value).toLocaleDateString();
  }

  if (!initialData.knowledge) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Could not load dashboard.</AlertDescription>
      </Alert>
    );
  }

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
              <CardTitle>Your AI Counselor setup</CardTitle>
              <CardDescription>
                Complete these steps to get your AI counselor ready for your website.
              </CardDescription>
            </div>
            <Badge variant="secondary">AI Counselor status: {readinessLabel}</Badge>
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
              {initialData.usage?.leadsCapturedThisPeriod ?? 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Messages used</CardDescription>
            <CardTitle className="text-2xl">
              {initialData.usage
                ? `${initialData.usage.messagesUsedThisPeriod} / ${initialData.usage.monthlyMessageLimit}`
                : "—"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Knowledge pages</CardDescription>
            <CardTitle className="text-2xl">{initialData.completedPages}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Business</CardDescription>
            <CardTitle className="text-lg truncate">
              {initialData.businessName || "Not set"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {initialData.widgetMonitor ? (
        <Card className="shadow-md ring-primary/5">
          <CardHeader>
            <CardTitle>Website widget</CardTitle>
            <CardDescription>
              Whether the AI counselor is running on your website.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
            <div>
              <p className="text-muted-foreground">Widget status</p>
              <p className="mt-1 font-medium">
                {initialData.widgetMonitor.status === "installed"
                  ? "Widget installed"
                  : initialData.widgetMonitor.status === "removed"
                    ? "Widget not detected"
                    : "Installation not detected"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Monitoring</p>
              <p className="mt-1 font-medium">
                {initialData.widgetMonitor.monitoringLabel}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">First installed</p>
              <p className="mt-1 font-medium">
                {formatMonitorDate(initialData.widgetMonitor.firstInstalledAt)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Last seen / last checked</p>
              <p className="mt-1 font-medium">
                {formatMonitorDate(initialData.widgetMonitor.lastSeenAt)} /{" "}
                {formatMonitorDate(initialData.widgetMonitor.lastCheckedAt)}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
