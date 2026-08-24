import { DEFAULT_LEAD_FIELDS } from "@/lib/widget/defaults";
import {
  type LeadFieldConfig,
  MAX_LEAD_FIELDS,
  isValidLeadFieldId,
} from "@/lib/widget/types";
import { ApiValidationError } from "@/lib/validation/errors";

const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const MAX_LABEL_LENGTH = 80;
const MAX_LAUNCHER_HINT_TEXT_LENGTH = 80;
const MIN_LEAD_FIELDS = 1;

function normalizeHexColor(value: unknown, fieldName: string) {
  if (typeof value !== "string") {
    throw new ApiValidationError(
      `INVALID_${fieldName.toUpperCase()}`,
      `${fieldName} must be a hex color.`,
      400,
    );
  }

  const trimmed = value.trim();

  if (!HEX_COLOR_PATTERN.test(trimmed)) {
    throw new ApiValidationError(
      `INVALID_${fieldName.toUpperCase()}`,
      `${fieldName} must be a valid hex color (example: #25D366).`,
      400,
    );
  }

  if (trimmed.length === 4) {
    const r = trimmed[1];
    const g = trimmed[2];
    const b = trimmed[3];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }

  return trimmed.toLowerCase();
}

function parseLeadFormEnabled(value: unknown) {
  if (typeof value !== "boolean") {
    throw new ApiValidationError(
      "INVALID_LEAD_FORM_ENABLED",
      "leadFormEnabled must be true or false.",
      400,
    );
  }

  return value;
}

function parseLeadFieldId(value: unknown): string {
  if (typeof value !== "string" || !isValidLeadFieldId(value)) {
    throw new ApiValidationError(
      "INVALID_LEAD_FIELD",
      "Lead field id must be name, phone, email, or a custom field id.",
      400,
    );
  }

  return value;
}

type ParseLeadFieldsOptions = {
  leadFormEnabled?: boolean;
};

export function parseLeadFieldsInput(
  value: unknown,
  options: ParseLeadFieldsOptions = {},
): LeadFieldConfig[] {
  const leadFormEnabled = options.leadFormEnabled ?? true;

  if (!Array.isArray(value)) {
    throw new ApiValidationError(
      "INVALID_LEAD_FIELDS",
      "leadFields must be an array.",
      400,
    );
  }

  if (leadFormEnabled) {
    if (value.length < MIN_LEAD_FIELDS || value.length > MAX_LEAD_FIELDS) {
      throw new ApiValidationError(
        "INVALID_LEAD_FIELDS",
        `Include between ${MIN_LEAD_FIELDS} and ${MAX_LEAD_FIELDS} form fields.`,
        400,
      );
    }
  } else if (value.length > MAX_LEAD_FIELDS) {
    throw new ApiValidationError(
      "INVALID_LEAD_FIELDS",
      `Maximum ${MAX_LEAD_FIELDS} form fields when saved.`,
      400,
    );
  }

  if (!leadFormEnabled && value.length === 0) {
    return [];
  }

  const seen = new Set<string>();
  const fields: LeadFieldConfig[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new ApiValidationError(
        "INVALID_LEAD_FIELDS",
        "Each lead field must be an object.",
        400,
      );
    }

    const record = item as Record<string, unknown>;
    const id = parseLeadFieldId(record.id);

    if (seen.has(id)) {
      throw new ApiValidationError(
        "DUPLICATE_LEAD_FIELD",
        `Duplicate field: ${id}.`,
        400,
      );
    }

    seen.add(id);

    if (typeof record.required !== "boolean") {
      throw new ApiValidationError(
        "INVALID_LEAD_FIELD",
        "Each field must include required: true or false.",
        400,
      );
    }

    if (typeof record.label !== "string") {
      throw new ApiValidationError(
        "INVALID_LEAD_FIELD",
        "Each field must include a label.",
        400,
      );
    }

    const label = record.label.trim();

    if (!label) {
      throw new ApiValidationError(
        "INVALID_LEAD_FIELD",
        "Field labels cannot be empty.",
        400,
      );
    }

    if (label.length > MAX_LABEL_LENGTH) {
      throw new ApiValidationError(
        "INVALID_LEAD_FIELD",
        "Field labels are too long.",
        400,
      );
    }

    fields.push({
      id,
      required: record.required,
      label,
    });
  }

  if (leadFormEnabled && !fields.some((field) => field.required)) {
    throw new ApiValidationError(
      "INVALID_LEAD_FIELDS",
      "At least one field must be required.",
      400,
    );
  }

  return fields;
}

function parseLauncherHintText(value: unknown) {
  if (typeof value !== "string") {
    throw new ApiValidationError(
      "INVALID_LAUNCHER_HINT_TEXT",
      "launcherHintText must be a string.",
      400,
    );
  }

  const trimmed = value.trim();

  if (!trimmed) {
    throw new ApiValidationError(
      "INVALID_LAUNCHER_HINT_TEXT",
      "Bubble text cannot be empty.",
      400,
    );
  }

  if (trimmed.length > MAX_LAUNCHER_HINT_TEXT_LENGTH) {
    throw new ApiValidationError(
      "INVALID_LAUNCHER_HINT_TEXT",
      `Bubble text must be ${MAX_LAUNCHER_HINT_TEXT_LENGTH} characters or less.`,
      400,
    );
  }

  return trimmed;
}

export function parseWidgetSettingsPayload(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ApiValidationError(
      "INVALID_BODY",
      "Request body must be a JSON object.",
      400,
    );
  }

  const payload = body as Record<string, unknown>;
  const leadFormEnabled = parseLeadFormEnabled(payload.leadFormEnabled);

  return {
    headerColor: normalizeHexColor(payload.headerColor, "headerColor"),
    accentColor: normalizeHexColor(payload.accentColor, "accentColor"),
    launcherHintText: parseLauncherHintText(payload.launcherHintText),
    launcherHintColor: normalizeHexColor(
      payload.launcherHintColor,
      "launcherHintColor",
    ),
    leadFormEnabled,
    leadFields: parseLeadFieldsInput(payload.leadFields, { leadFormEnabled }),
  };
}

export function parseLeadFieldsFromDb(
  value: unknown,
  leadFormEnabled = true,
): LeadFieldConfig[] {
  try {
    return parseLeadFieldsInput(value, { leadFormEnabled });
  } catch {
    return leadFormEnabled
      ? DEFAULT_LEAD_FIELDS.map((field) => ({ ...field }))
      : [];
  }
}
