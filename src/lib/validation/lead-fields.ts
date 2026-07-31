import type { LeadFieldConfig, LeadFieldId } from "@/lib/widget/types";
import {
  isCustomLeadFieldId,
  isStandardLeadFieldId,
  MAX_CUSTOM_FIELD_VALUE_LENGTH,
} from "@/lib/widget/types";
import { ApiValidationError } from "@/lib/validation/errors";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LENGTH = 200;
const MAX_PHONE_LENGTH = 50;
const MAX_EMAIL_LENGTH = 254;

function isValidPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7;
}

type LeadPayloadInput = {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  customFields?: Record<string, unknown>;
};

export type ParsedLeadValues = {
  name: string | null;
  phone: string | null;
  email: string | null;
  customFields: Record<string, string>;
};

function readCustomFieldValue(
  fieldId: string,
  payload: LeadPayloadInput,
) {
  const fromObject = payload.customFields?.[fieldId];

  if (fromObject !== undefined && fromObject !== null) {
    return fromObject;
  }

  return undefined;
}

export function buildLeadValuesFromConfig(
  leadFields: LeadFieldConfig[],
  payload: LeadPayloadInput,
): ParsedLeadValues {
  const includedIds = new Set(leadFields.map((field) => field.id));

  for (const key of ["name", "phone", "email"] as LeadFieldId[]) {
    const value = payload[key];
    const hasValue =
      value !== undefined &&
      value !== null &&
      typeof value === "string" &&
      value.trim().length > 0;

    if (!includedIds.has(key) && hasValue) {
      throw new ApiValidationError(
        "LEAD_FIELD_NOT_ALLOWED",
        `Field "${key}" is not part of this chatbot form.`,
        400,
      );
    }
  }

  if (payload.customFields && typeof payload.customFields === "object") {
    for (const [key, value] of Object.entries(payload.customFields)) {
      const hasValue =
        value !== undefined &&
        value !== null &&
        typeof value === "string" &&
        value.trim().length > 0;

      if (!includedIds.has(key) && hasValue) {
        throw new ApiValidationError(
          "LEAD_FIELD_NOT_ALLOWED",
          `Field "${key}" is not part of this chatbot form.`,
          400,
        );
      }
    }
  }

  const result: ParsedLeadValues = {
    name: null,
    phone: null,
    email: null,
    customFields: {},
  };

  for (const field of leadFields) {
    const raw = isCustomLeadFieldId(field.id)
      ? readCustomFieldValue(field.id, payload)
      : payload[field.id as LeadFieldId];

    const trimmed =
      raw === undefined || raw === null ? "" : String(raw).trim();

    if (field.required && !trimmed) {
      throw new ApiValidationError(
        "MISSING_LEAD_FIELD",
        `${field.label} is required.`,
        400,
      );
    }

    if (!trimmed) {
      if (isStandardLeadFieldId(field.id)) {
        result[field.id] = null;
      }
      continue;
    }

    if (field.id === "name" && trimmed.length > MAX_NAME_LENGTH) {
      throw new ApiValidationError("NAME_TOO_LONG", "Name is too long.", 400);
    }

    if (field.id === "phone") {
      if (trimmed.length > MAX_PHONE_LENGTH) {
        throw new ApiValidationError("PHONE_TOO_LONG", "Phone is too long.", 400);
      }

      if (!isValidPhone(trimmed)) {
        throw new ApiValidationError(
          "INVALID_PHONE",
          "Please enter a valid phone number.",
          400,
        );
      }
    }

    if (field.id === "email") {
      if (trimmed.length > MAX_EMAIL_LENGTH) {
        throw new ApiValidationError("EMAIL_TOO_LONG", "Email is too long.", 400);
      }

      if (!EMAIL_PATTERN.test(trimmed)) {
        throw new ApiValidationError("INVALID_EMAIL", "Email format is invalid.", 400);
      }
    }

    if (isCustomLeadFieldId(field.id)) {
      if (trimmed.length > MAX_CUSTOM_FIELD_VALUE_LENGTH) {
        throw new ApiValidationError(
          "CUSTOM_FIELD_TOO_LONG",
          `${field.label} is too long.`,
          400,
        );
      }

      result.customFields[field.id] = trimmed;
      continue;
    }

    if (isStandardLeadFieldId(field.id)) {
      result[field.id] = trimmed;
    }
  }

  return result;
}

export function validateLeadPayloadForFields(
  leadFields: LeadFieldConfig[],
  body: unknown,
) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ApiValidationError("INVALID_BODY", "Request body must be a JSON object.");
  }

  const payload = body as Record<string, unknown>;

  return buildLeadValuesFromConfig(leadFields, {
    name: payload.name as string | null | undefined,
    phone: payload.phone as string | null | undefined,
    email: payload.email as string | null | undefined,
    customFields: payload.customFields as Record<string, unknown> | undefined,
  });
}
