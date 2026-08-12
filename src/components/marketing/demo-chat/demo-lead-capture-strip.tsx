"use client";

import { ArrowUp } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInputWithCountryCode } from "@/components/chatbot/phone-input-with-country-code";
import { DEMO_LEAD } from "@/lib/demo/constants";
import type { LeadFieldConfig } from "@/lib/widget/types";
import { isStandardLeadFieldId } from "@/lib/widget/types";
import {
  getLeadFieldInputType,
  validateLeadFormClient,
} from "@/lib/widget/lead-form-client";

type DemoLeadCaptureStripProps = {
  leadFields: LeadFieldConfig[];
  onSuccess: () => void;
};

function emptyValues(fields: LeadFieldConfig[]) {
  const values: Record<string, string> = {};

  for (const field of fields) {
    values[field.id] = "";
  }

  return values;
}

function getDemoFieldValue(fieldId: string) {
  if (fieldId === "name") {
    return DEMO_LEAD.name;
  }

  if (fieldId === "email") {
    return DEMO_LEAD.email;
  }

  if (fieldId === "phone") {
    return DEMO_LEAD.phone;
  }

  return "";
}

function buildSampleValues(fields: LeadFieldConfig[]) {
  const values: Record<string, string> = {};

  for (const field of fields) {
    values[field.id] = getDemoFieldValue(field.id);
  }

  return values;
}

export function DemoLeadCaptureStrip({
  leadFields,
  onSuccess,
}: DemoLeadCaptureStripProps) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    emptyValues(leadFields),
  );
  const [error, setError] = useState<string | null>(null);

  const fieldInputTypes = useMemo(
    () =>
      Object.fromEntries(
        leadFields.map((field) => [field.id, getLeadFieldInputType(field)]),
      ),
    [leadFields],
  );

  function updateValue(id: string, value: string) {
    setValues((current) => ({ ...current, [id]: value }));
    setError(null);
  }

  function handleUseSampleData() {
    setValues(buildSampleValues(leadFields));
    setError(null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const validationError = validateLeadFormClient(leadFields, values);

    if (validationError) {
      setError(validationError);
      return;
    }

    onSuccess();
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
              aria-label={field.label}
              className="[&_input]:border-[var(--widget-accent)]/60 [&_select]:border-[var(--widget-accent)]/60"
            />
          ) : (
            <Input
              key={field.id}
              type={fieldInputTypes[field.id] ?? "text"}
              value={values[field.id] ?? ""}
              onChange={(event) => updateValue(field.id, event.target.value)}
              placeholder={field.label}
              required={field.required}
              autoComplete={isStandardLeadFieldId(field.id) ? field.id : "off"}
              className="h-9 rounded-lg border-2 border-[var(--widget-accent)]/60 bg-white text-sm text-zinc-800 shadow-none placeholder:text-zinc-500"
              aria-label={field.label}
            />
          ),
        )}
        <Button
          type="button"
          className="h-auto min-h-9 w-full gap-2 rounded-full border-transparent bg-[#112437] py-2 text-sm font-medium text-white shadow-none hover:bg-[#1a334d] hover:text-white"
          onClick={handleUseSampleData}
        >
          <ArrowUp className="size-3.5 shrink-0" aria-hidden />
          <span className="inline-flex flex-wrap items-center justify-center gap-2">
            Use sample details
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-normal uppercase tracking-wide text-white/90">
              Only in demo
            </span>
          </span>
          <ArrowUp className="size-3.5 shrink-0" aria-hidden />
        </Button>
        <Button
          type="submit"
          variant="widgetAccent"
          className="mt-1 h-9 w-full rounded-full text-sm font-medium"
        >
          Show My Answer →
        </Button>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </form>
    </div>
  );
}
