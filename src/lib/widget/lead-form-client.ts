import type { LeadFieldConfig } from "@/lib/widget/types";
import {
  isCustomLeadFieldId,
  isStandardLeadFieldId,
  MAX_CUSTOM_FIELD_VALUE_LENGTH,
} from "@/lib/widget/types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7;
}

export function validateLeadFormClient(
  leadFields: LeadFieldConfig[],
  values: Record<string, string>,
) {
  for (const field of leadFields) {
    const trimmed = values[field.id]?.trim() ?? "";

    if (field.required && !trimmed) {
      return `${field.label} is required.`;
    }

    if (!trimmed) {
      continue;
    }

    if (field.id === "phone" && !isValidPhone(trimmed)) {
      return "Please enter a valid phone number.";
    }

    if (field.id === "email" && !EMAIL_PATTERN.test(trimmed)) {
      return "Please enter a valid email address.";
    }

    if (
      isCustomLeadFieldId(field.id) &&
      trimmed.length > MAX_CUSTOM_FIELD_VALUE_LENGTH
    ) {
      return `${field.label} is too long.`;
    }
  }

  return null;
}

export function getLeadFieldInputType(field: LeadFieldConfig) {
  if (isStandardLeadFieldId(field.id)) {
    if (field.id === "phone") {
      return "tel";
    }

    if (field.id === "email") {
      return "email";
    }

    return "text";
  }

  return "text";
}

export function buildCustomFieldsPayload(
  leadFields: LeadFieldConfig[],
  values: Record<string, string>,
) {
  const customFields: Record<string, string> = {};

  for (const field of leadFields) {
    if (!isCustomLeadFieldId(field.id)) {
      continue;
    }

    const trimmed = values[field.id]?.trim() ?? "";

    if (trimmed) {
      customFields[field.id] = trimmed;
    }
  }

  return customFields;
}
