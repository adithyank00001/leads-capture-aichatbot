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

export function BotSettingsForm() {
  const [businessName, setBusinessName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [services, setServices] = useState("");
  const [pricingNotes, setPricingNotes] = useState("");
  const [currentOffer, setCurrentOffer] = useState("");
  const [openingHours, setOpeningHours] = useState("");
  const [contactMethod, setContactMethod] = useState("");
  const [extraNotes, setExtraNotes] = useState("");
  const [allowedDomains, setAllowedDomains] = useState("");
  const [usageText, setUsageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const { response, body: result } =
          await fetchJsonWithTimeout<BotSettingsResponse>("/api/dashboard/bot");

        if (!response.ok || !result.ok || !result.data) {
          throw new Error(result.error?.message ?? "Could not load settings.");
        }

        setBusinessName(result.data.bot.business_name ?? "");
        setDescription(result.data.knowledge.description ?? "");
        setLocation(result.data.knowledge.location ?? "");
        setServices(result.data.knowledge.services ?? "");
        setPricingNotes(result.data.knowledge.pricing_notes ?? "");
        setCurrentOffer(result.data.knowledge.current_offer ?? "");
        setOpeningHours(result.data.knowledge.opening_hours ?? "");
        setContactMethod(result.data.knowledge.contact_method ?? "");
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
  }, []);

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
          description,
          location,
          services,
          pricingNotes,
          currentOffer,
          openingHours,
          contactMethod,
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
              Add the information your chatbot needs to answer customers.
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Short description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="min-h-20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="openingHours">Opening hours</Label>
              <Input
                id="openingHours"
                value={openingHours}
                onChange={(event) => setOpeningHours(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactMethod">Contact details</Label>
              <Input
                id="contactMethod"
                value={contactMethod}
                onChange={(event) => setContactMethod(event.target.value)}
              />
            </div>
          </SettingsSection>

          <SettingsSection
            title="What your chatbot should know"
            description="Manual information — Add details you want the chatbot to always follow. Manual information has priority over your website."
          >
            <div className="space-y-2">
              <Label htmlFor="services">Services</Label>
              <Textarea
                id="services"
                value={services}
                onChange={(event) => setServices(event.target.value)}
                className="min-h-20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pricingNotes">Pricing information</Label>
              <Textarea
                id="pricingNotes"
                value={pricingNotes}
                onChange={(event) => setPricingNotes(event.target.value)}
                className="min-h-20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentOffer">Current offers</Label>
              <Textarea
                id="currentOffer"
                value={currentOffer}
                onChange={(event) => setCurrentOffer(event.target.value)}
                className="min-h-20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="extraNotes">Extra information</Label>
              <Textarea
                id="extraNotes"
                value={extraNotes}
                onChange={(event) => setExtraNotes(event.target.value)}
                className="min-h-20"
              />
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
                placeholder="stylette.com"
              />
              <p className="text-sm text-muted-foreground">
                Use a real domain with an ending like .com or .in (example:
                stylette.com).
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
