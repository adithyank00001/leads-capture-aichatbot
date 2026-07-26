"use client";

import { useEffect, useState } from "react";

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
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch("/api/dashboard/bot");
        const result = (await response.json()) as BotSettingsResponse;

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
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load settings.",
        );
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
    setMessage(null);

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

      setMessage("Saved.");
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Could not save settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-zinc-600">Loading settings...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border border-zinc-300 bg-white p-4">
      <h1 className="text-xl font-semibold">Business settings</h1>
      <p className="text-sm text-zinc-600">
        Plain MVP form. Save your business info here. The chatbot AI will use it.
      </p>
      {usageText ? <p className="text-sm text-zinc-700">{usageText}</p> : null}

      {[
        ["Business name", businessName, setBusinessName],
        ["Description", description, setDescription],
        ["Location", location, setLocation],
        ["Services", services, setServices],
        ["Pricing notes", pricingNotes, setPricingNotes],
        ["Current offer", currentOffer, setCurrentOffer],
        ["Opening hours", openingHours, setOpeningHours],
        ["Contact method", contactMethod, setContactMethod],
        ["Extra notes", extraNotes, setExtraNotes],
      ].map(([label, value, setter]) => (
        <label key={label as string} className="block text-sm">
          {label as string}
          <textarea
            value={value as string}
            onChange={(event) => (setter as (value: string) => void)(event.target.value)}
            className="mt-1 min-h-20 w-full border border-zinc-300 px-3 py-2"
          />
        </label>
      ))}

      <label className="block text-sm">
        Your website domain
        <input
          type="text"
          value={allowedDomains}
          onChange={(event) => setAllowedDomains(event.target.value)}
          placeholder="stylette.com"
          className="mt-1 w-full border border-zinc-300 px-3 py-2"
        />
      </label>
      <p className="text-sm text-zinc-600">
        Enter the one website where your chatbot should work. Use a real domain
        with an ending like .com or .in (example: stylette.com).
      </p>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {message ? <p className="text-sm text-green-700">{message}</p> : null}

      <button
        type="submit"
        disabled={saving}
        className="border border-zinc-900 bg-zinc-900 px-4 py-2 text-white disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
