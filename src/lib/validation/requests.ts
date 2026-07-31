import { ApiValidationError } from "@/lib/validation/errors";

const MAX_BOT_ID_LENGTH = 100;
const MAX_SESSION_ID_LENGTH = 200;
const MAX_NAME_LENGTH = 200;
const MAX_PHONE_LENGTH = 50;
const MAX_EMAIL_LENGTH = 254;
const MAX_PAGE_URL_LENGTH = 2000;
const MAX_MESSAGE_LENGTH = 2000;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function requireObject(body: unknown, code = "INVALID_BODY"): Record<string, unknown> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ApiValidationError(code, "Request body must be a JSON object.");
  }

  return body as Record<string, unknown>;
}

function requireNonEmptyString(
  value: unknown,
  fieldName: string,
  maxLength: number,
): string {
  if (value === undefined || value === null) {
    throw new ApiValidationError(
      `MISSING_${fieldName.toUpperCase()}`,
      `${fieldName} is required.`,
    );
  }

  if (typeof value !== "string") {
    throw new ApiValidationError(
      `INVALID_${fieldName.toUpperCase()}`,
      `${fieldName} must be a text value.`,
    );
  }

  const trimmed = value.trim();

  if (!trimmed) {
    throw new ApiValidationError(
      `MISSING_${fieldName.toUpperCase()}`,
      `${fieldName} is required.`,
    );
  }

  if (trimmed.length > maxLength) {
    throw new ApiValidationError(
      `${fieldName.toUpperCase()}_TOO_LONG`,
      `${fieldName} is too long.`,
    );
  }

  return trimmed;
}

function optionalString(
  value: unknown,
  fieldName: string,
  maxLength: number,
): string | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new ApiValidationError(
      `INVALID_${fieldName.toUpperCase()}`,
      `${fieldName} must be a text value.`,
    );
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  if (trimmed.length > maxLength) {
    throw new ApiValidationError(
      `${fieldName.toUpperCase()}_TOO_LONG`,
      `${fieldName} is too long.`,
    );
  }

  return trimmed;
}

export function parseLeadPayload(body: unknown) {
  const payload = requireObject(body);

  const botId = requireNonEmptyString(payload.botId, "botId", MAX_BOT_ID_LENGTH);
  const sessionId = requireNonEmptyString(
    payload.sessionId,
    "sessionId",
    MAX_SESSION_ID_LENGTH,
  );
  const pageUrl = optionalString(payload.pageUrl, "pageUrl", MAX_PAGE_URL_LENGTH);

  function optionalLeadValue(value: unknown, fieldName: string) {
    if (value === undefined || value === null) {
      return null;
    }

    if (typeof value !== "string") {
      throw new ApiValidationError(
        `INVALID_${fieldName.toUpperCase()}`,
        `${fieldName} must be a text value.`,
      );
    }

    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  function parseCustomFields(value: unknown): Record<string, string> | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }

    if (typeof value !== "object" || Array.isArray(value)) {
      throw new ApiValidationError(
        "INVALID_CUSTOM_FIELDS",
        "customFields must be an object.",
        400,
      );
    }

    const result: Record<string, string> = {};

    for (const [key, fieldValue] of Object.entries(value)) {
      if (typeof fieldValue !== "string") {
        throw new ApiValidationError(
          "INVALID_CUSTOM_FIELDS",
          "Each custom field value must be text.",
          400,
        );
      }

      result[key] = fieldValue;
    }

    return result;
  }

  return {
    botId,
    sessionId,
    pageUrl: pageUrl ?? null,
    name: optionalLeadValue(payload.name, "name"),
    phone: optionalLeadValue(payload.phone, "phone"),
    email: optionalLeadValue(payload.email, "email"),
    customFields: parseCustomFields(payload.customFields),
  };
}

export function parseChatPayload(body: unknown) {
  const payload = requireObject(body);

  const botId = requireNonEmptyString(payload.botId, "botId", MAX_BOT_ID_LENGTH);
  const sessionId = requireNonEmptyString(
    payload.sessionId,
    "sessionId",
    MAX_SESSION_ID_LENGTH,
  );
  const message = requireNonEmptyString(
    payload.message,
    "message",
    MAX_MESSAGE_LENGTH,
  );
  const pageUrl = optionalString(payload.pageUrl, "pageUrl", MAX_PAGE_URL_LENGTH);

  return {
    botId,
    sessionId,
    message,
    pageUrl: pageUrl ?? null,
  };
}

export const validationLimits = {
  maxMessageLength: MAX_MESSAGE_LENGTH,
};
