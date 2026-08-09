"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
        Demo only — these details are not saved
      </p>
      <p className="mb-3 text-sm font-semibold leading-snug text-[var(--widget-accent)]">
        Let&apos;s get your details first — then I&apos;ll answer your question.
      </p>
      <form onSubmit={handleSubmit} className="space-y-2">
        {leadFields.map((field) => (
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
        ))}
        <Button
          type="button"
          variant="outline"
          className="h-9 w-full rounded-full border-[var(--widget-accent)]/40 text-sm font-medium text-[var(--widget-accent)]"
          onClick={handleUseSampleData}
        >
          Use sample data
        </Button>
        <Button
          type="submit"
          variant="widgetAccent"
          className="mt-1 h-9 w-full rounded-full text-sm font-medium"
        >
          Submit details
        </Button>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </form>
    </div>
  );
}
