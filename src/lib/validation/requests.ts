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
  const name = requireNonEmptyString(payload.name, "name", MAX_NAME_LENGTH);
  const phone = requireNonEmptyString(payload.phone, "phone", MAX_PHONE_LENGTH);
  const email = optionalString(payload.email, "email", MAX_EMAIL_LENGTH);
  const pageUrl = optionalString(payload.pageUrl, "pageUrl", MAX_PAGE_URL_LENGTH);

  if (email && !EMAIL_PATTERN.test(email)) {
    throw new ApiValidationError("INVALID_EMAIL", "Email format is invalid.");
  }

  return {
    botId,
    sessionId,
    name,
    phone,
    email: email ?? null,
    pageUrl: pageUrl ?? null,
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

  return {
    botId,
    sessionId,
    message,
  };
}

export const validationLimits = {
  maxMessageLength: MAX_MESSAGE_LENGTH,
};
