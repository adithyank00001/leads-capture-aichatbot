"use client";

import { useEffect, useState } from "react";

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
        }),
      });

      const result = (await response.json()) as BotSettingsResponse;

      if (!response.ok || !result.ok) {
        throw new Error(result.error?.message ?? "Could not save settings.");
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
