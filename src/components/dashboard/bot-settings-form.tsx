"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageLoadingSkeleton } from "@/components/dashboard/page-loading-skeleton";
import { SettingsSection } from "@/components/dashboard/settings-section";
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
import { Textarea } from "@/components/ui/textarea";
import { fetchJsonWithTimeout } from "@/lib/api/fetch-client";
import { getCustomerErrorMessage } from "@/lib/dashboard/customer-errors";
import type { BotSettingsInitialData } from "@/lib/dashboard/overview-data";
import {
  INVALID_DOMAIN_ERROR,
  REQUIRED_DOMAIN_ERROR,
  SINGLE_DOMAIN_ERROR,
  isValidWebsiteDomain,
  splitAllowedDomainsInput,
} from "@/lib/validation/bot-settings";

type BotSettingsResponse = {
  ok: boolean;
  data?: {
    bot: {
      bot_id: string;
      business_name: string;
    };
    knowledge: {
      description: string;
      location: string;
      services: string;
      pricing_notes: string;
      current_offer: string;
      opening_hours: string;
      contact_method: string;
      extra_notes: string;
    };
    allowedDomains: string[];
    usage: {
      monthlyMessageLimit: number;
      messagesUsedThisPeriod: number;
      leadsCapturedThisPeriod: number;
    } | null;
  };
  error?: {
    message: string;
  };
};

/** Loaded from API but not shown in the form — still sent on save so nothing is wiped. */
type LegacyKnowledgeFields = {
  description: string;
  location: string;
  services: string;
  openingHours: string;
  contactMethod: string;
};

function usageLabel(usage: BotSettingsInitialData["usage"]) {
  if (!usage) {
    return "";
  }

  return `${usage.messagesUsedThisPeriod} / ${usage.monthlyMessageLimit} messages used this month`;
}

function applyInitialData(data: BotSettingsInitialData) {
  return {
    businessName: data.businessName,
    legacyKnowledge: {
      description: data.knowledge.description,
      location: data.knowledge.location,
      services: data.knowledge.services,
      openingHours: data.knowledge.opening_hours,
      contactMethod: data.knowledge.contact_method,
    },
    pricingNotes: data.knowledge.pricing_notes,
    currentOffer: data.knowledge.current_offer,
    extraNotes: data.knowledge.extra_notes,
    allowedDomains: data.allowedDomains[0] ?? "",
    usageText: usageLabel(data.usage),
  };
}

type BotSettingsFormProps = {
  initialData?: BotSettingsInitialData;
};

export function BotSettingsForm({ initialData }: BotSettingsFormProps) {
  const seeded = initialData ? applyInitialData(initialData) : null;
  const [businessName, setBusinessName] = useState(seeded?.businessName ?? "");
  const [legacyKnowledge, setLegacyKnowledge] = useState<LegacyKnowledgeFields>(
    seeded?.legacyKnowledge ?? {
      description: "",
      location: "",
      services: "",
      openingHours: "",
      contactMethod: "",
    },
  );
  const [pricingNotes, setPricingNotes] = useState(seeded?.pricingNotes ?? "");
  const [currentOffer, setCurrentOffer] = useState(seeded?.currentOffer ?? "");
  const [extraNotes, setExtraNotes] = useState(seeded?.extraNotes ?? "");
  const [allowedDomains, setAllowedDomains] = useState(seeded?.allowedDomains ?? "");
  const [usageText, setUsageText] = useState(seeded?.usageText ?? "");
  const [loading, setLoading] = useState(!initialData);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      return;
    }

    async function loadSettings() {
      try {
        const { response, body: result } =
          await fetchJsonWithTimeout<BotSettingsResponse>("/api/dashboard/bot");

        if (!response.ok || !result.ok || !result.data) {
          throw new Error(result.error?.message ?? "Could not load settings.");
        }

        setBusinessName(result.data.bot.business_name ?? "");
        setLegacyKnowledge({
          description: result.data.knowledge.description ?? "",
          location: result.data.knowledge.location ?? "",
          services: result.data.knowledge.services ?? "",
          openingHours: result.data.knowledge.opening_hours ?? "",
          contactMethod: result.data.knowledge.contact_method ?? "",
        });
        setPricingNotes(result.data.knowledge.pricing_notes ?? "");
        setCurrentOffer(result.data.knowledge.current_offer ?? "");
        setExtraNotes(result.data.knowledge.extra_notes ?? "");
        setAllowedDomains((result.data.allowedDomains ?? [])[0] ?? "");

        if (result.data.usage) {
          setUsageText(
            `${result.data.usage.messagesUsedThisPeriod} / ${result.data.usage.monthlyMessageLimit} messages used this month`,
          );
        }
      } catch (loadError) {
        setError(getCustomerErrorMessage(loadError));
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [initialData]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const domains = splitAllowedDomainsInput(allowedDomains);

    if (domains.length === 0) {
      setError(REQUIRED_DOMAIN_ERROR);
      setSaving(false);
      return;
    }

    if (domains.length > 1) {
      setError(SINGLE_DOMAIN_ERROR);
      setSaving(false);
      return;
    }

    if (!isValidWebsiteDomain(domains[0])) {
      setError(INVALID_DOMAIN_ERROR);
      setSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/dashboard/bot", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessName,
          description: legacyKnowledge.description,
          location: legacyKnowledge.location,
          services: legacyKnowledge.services,
          pricingNotes,
          currentOffer,
          openingHours: legacyKnowledge.openingHours,
          contactMethod: legacyKnowledge.contactMethod,
          extraNotes,
          allowedDomains,
        }),
      });

      const result = (await response.json()) as BotSettingsResponse;

      if (!response.ok || !result.ok) {
        throw new Error(result.error?.message ?? "Could not save settings.");
      }

      if (result.data?.usage) {
        setUsageText(
          `${result.data.usage.messagesUsedThisPeriod} / ${result.data.usage.monthlyMessageLimit} messages used this month`,
        );
      }

      toast.success("Settings saved");
    } catch (saveError) {
      setError(getCustomerErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <PageLoadingSkeleton variant="settings" />;
  }

  return (
    <Card className="shadow-md ring-primary/5">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-2xl">Chatbot Setup</CardTitle>
            <CardDescription className="mt-1">
              We learn from your website automatically. Add only what visitors
              usually cannot find online or rules your chatbot must follow.
            </CardDescription>
          </div>
          {usageText ? <Badge variant="secondary">{usageText}</Badge> : null}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <SettingsSection title="Business details">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business name</Label>
              <Input
                id="businessName"
                value={businessName}
                onChange={(event) => setBusinessName(event.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Shown at the top of your chatbot.
              </p>
            </div>
          </SettingsSection>

          <SettingsSection
            title="Important instructions"
            description="These answers are given priority over your website. Use them for rules and details that are often missing from websites."
          >
            <div className="space-y-2">
              <Label htmlFor="pricingNotes">
                How should the chatbot handle pricing questions?
              </Label>
              <Textarea
                id="pricingNotes"
                value={pricingNotes}
                onChange={(event) => setPricingNotes(event.target.value)}
                className="min-h-20"
                placeholder="Example: Do not quote exact prices. Ask for their phone number and say our team will call back with a quote."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentOffer">
                Current promotion{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Textarea
                id="currentOffer"
                value={currentOffer}
                onChange={(event) => setCurrentOffer(event.target.value)}
                className="min-h-16"
                placeholder="Example: 10% off for first-time customers this month."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="extraNotes">
                Extra information{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Textarea
                id="extraNotes"
                value={extraNotes}
                onChange={(event) => setExtraNotes(event.target.value)}
                className="min-h-20"
                placeholder="Example: We only serve within 30 km of the city. Never promise same-day service."
              />
              <p className="text-sm text-muted-foreground">
                Service area, booking rules, or anything else not on your
                website.
              </p>
            </div>
          </SettingsSection>

          <SettingsSection
            title="Website connection"
            description="Your chatbot will only work on this website."
          >
            <div className="space-y-2">
              <Label htmlFor="allowed-domains">Website domain</Label>
              <Input
                id="allowed-domains"
                type="text"
                value={allowedDomains}
                onChange={(event) => setAllowedDomains(event.target.value)}
                placeholder="yourdomain.com"
              />
              <p className="text-sm text-muted-foreground">
                Use a real domain with an ending like .com or .in (example:
                yourdomain.com).
              </p>
            </div>
          </SettingsSection>

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <Button type="submit" disabled={saving} size="lg">
            {saving ? "Saving..." : "Save settings"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
