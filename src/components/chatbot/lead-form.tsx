"use client";

import { useState } from "react";

import { submitLead } from "@/lib/api/client";
import type { BusinessDisplay } from "@/lib/business/display";
import { markLeadCompleted } from "@/lib/session/client";

type LeadFormProps = {
  botId: string;
  sessionId: string;
  business: BusinessDisplay;
  parentPageUrl?: string | null;
  onSuccess: () => void;
};

function isValidPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7;
}

export function LeadForm({
  botId,
  sessionId,
  business,
  parentPageUrl,
  onSuccess,
}: LeadFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setError("Please enter your name.");
      return;
    }

    if (!trimmedPhone) {
      setError("Please enter your phone number.");
      return;
    }

    if (!isValidPhone(trimmedPhone)) {
      setError("Please enter a valid phone number.");
      return;
    }

    setIsSubmitting(true);

    try {
      await submitLead({
        botId,
        sessionId,
        name: trimmedName,
        phone: trimmedPhone,
        email: trimmedEmail || undefined,
        pageUrl:
          parentPageUrl ??
          (typeof window !== "undefined" ? window.location.href : undefined),
      });

      markLeadCompleted(botId, sessionId);
      onSuccess();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not save your details.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="border-b border-border bg-card px-4 py-4 shadow-sm">
        <h1 className="text-lg font-semibold tracking-tight text-foreground">
          {business.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {business.welcomeMessage}
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-1 flex-col px-4 py-5">
        <div className="space-y-4">
          <label className="block text-sm font-medium text-foreground">
            Name
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Your name"
              autoComplete="name"
              disabled={isSubmitting}
            />
          </label>

          <label className="block text-sm font-medium text-foreground">
            Phone number
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="+1 555 123 4567"
              autoComplete="tel"
              disabled={isSubmitting}
            />
          </label>

          <label className="block text-sm font-medium text-foreground">
            Email{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="you@example.com"
              autoComplete="email"
              disabled={isSubmitting}
            />
          </label>
        </div>

        {error ? (
          <p className="mt-4 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-md transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Starting chat…" : "Start chat"}
        </button>
      </form>
    </div>
  );
}
