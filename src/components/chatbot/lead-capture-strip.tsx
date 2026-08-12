"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInputWithCountryCode } from "@/components/chatbot/phone-input-with-country-code";
import { submitLead } from "@/lib/api/client";
import type { LeadFieldConfig } from "@/lib/widget/types";
import { isStandardLeadFieldId } from "@/lib/widget/types";
import {
  buildCustomFieldsPayload,
  getLeadFieldInputType,
  validateLeadFormClient,
} from "@/lib/widget/lead-form-client";

type LeadCaptureStripProps = {
  botId: string;
  sessionId: string;
  leadFields: LeadFieldConfig[];
  parentPageUrl?: string | null;
  onSuccess: () => void;
};

function emptyValues(fields: LeadFieldConfig[]) {
  const values: Record<string, string> = {};

  for (const field of fields) {
    values[field.id] = "";
  }

  return values;
}

export function LeadCaptureStrip({
  botId,
  sessionId,
  leadFields,
  parentPageUrl,
  onSuccess,
}: LeadCaptureStripProps) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    emptyValues(leadFields),
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fieldInputTypes = useMemo(
    () =>
      Object.fromEntries(
        leadFields.map((field) => [field.id, getLeadFieldInputType(field)]),
      ),
    [leadFields],
  );

  function updateValue(id: string, value: string) {
    setValues((current) => ({ ...current, [id]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const validationError = validateLeadFormClient(leadFields, values);

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      await submitLead({
        botId,
        sessionId,
        name: values.name || null,
        phone: values.phone || null,
        email: values.email || null,
        customFields: buildCustomFieldsPayload(leadFields, values),
        pageUrl:
          parentPageUrl ??
          (typeof window !== "undefined" ? window.location.href : undefined),
      });

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
    <div className="bg-transparent px-4 py-3">
      <div className="mb-3 space-y-1 text-sm font-semibold leading-snug text-[var(--widget-accent)]">
        <p>Your answer is ready</p>
        <p>Complete the fields below to reveal it.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-2">
        {leadFields.map((field) =>
          field.id === "phone" ? (
            <PhoneInputWithCountryCode
              key={field.id}
              value={values[field.id] ?? ""}
              onChange={(nextValue) => updateValue(field.id, nextValue)}
              placeholder={field.label}
              disabled={isSubmitting}
              aria-label={field.label}
            />
          ) : (
            <Input
              key={field.id}
              type={fieldInputTypes[field.id] ?? "text"}
              value={values[field.id] ?? ""}
              onChange={(event) => updateValue(field.id, event.target.value)}
              placeholder={field.label}
              autoComplete={isStandardLeadFieldId(field.id) ? field.id : "off"}
              disabled={isSubmitting}
              className="h-9 rounded-lg border-2 border-[var(--widget-accent)] bg-white text-sm text-zinc-900 shadow-none placeholder:text-zinc-500 focus-visible:border-[var(--widget-accent)] focus-visible:ring-[var(--widget-accent)]/50"
              aria-label={field.label}
            />
          ),
        )}
        <Button
          type="submit"
          variant="widgetAccent"
          disabled={isSubmitting}
          className="mt-1 h-9 w-full rounded-full text-sm font-medium"
        >
          {isSubmitting ? "Saving…" : "Show My Answer →"}
        </Button>
        {error ? (
          <p className="text-xs font-medium text-red-700">{error}</p>
        ) : null}
      </form>
    </div>
  );
}
