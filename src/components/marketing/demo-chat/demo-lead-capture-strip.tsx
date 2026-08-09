"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEMO_LEAD } from "@/lib/demo/constants";
import type { LeadFieldConfig } from "@/lib/widget/types";
import { isStandardLeadFieldId } from "@/lib/widget/types";
import { getLeadFieldInputType } from "@/lib/widget/lead-form-client";

type DemoLeadCaptureStripProps = {
  leadFields: LeadFieldConfig[];
  onSuccess: () => void;
};

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

function buildInitialValues(fields: LeadFieldConfig[]) {
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
  const [values] = useState<Record<string, string>>(() =>
    buildInitialValues(leadFields),
  );

  const fieldInputTypes = useMemo(
    () =>
      Object.fromEntries(
        leadFields.map((field) => [field.id, getLeadFieldInputType(field)]),
      ),
    [leadFields],
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSuccess();
  }

  return (
    <div className="bg-transparent px-4 py-3">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
        Demo only — these details are not saved
      </p>
      <p className="mb-3 text-sm font-semibold leading-snug text-[var(--widget-accent)]">
        Add your details — we&apos;ll reply in seconds.
      </p>
      <form onSubmit={handleSubmit} className="space-y-2">
        {leadFields.map((field) => (
          <Input
            key={field.id}
            type={fieldInputTypes[field.id] ?? "text"}
            value={values[field.id] ?? ""}
            readOnly
            placeholder={field.label}
            autoComplete={isStandardLeadFieldId(field.id) ? field.id : "off"}
            className="h-9 cursor-default rounded-lg border-2 border-[var(--widget-accent)]/60 bg-zinc-50 text-sm text-zinc-700 shadow-none placeholder:text-zinc-500"
            aria-label={field.label}
          />
        ))}
        <Button
          type="submit"
          variant="widgetAccent"
          className="mt-1 h-9 w-full rounded-full text-sm font-medium"
        >
          Continue
        </Button>
      </form>
    </div>
  );
}
