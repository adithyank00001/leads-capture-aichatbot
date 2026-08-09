import { ApiValidationError } from "@/lib/validation/errors";
import { validationLimits } from "@/lib/validation/requests";
import { DEMO_MAX_HISTORY_ITEMS } from "@/lib/demo/constants";

const MAX_SESSION_ID_LENGTH = 200;

function requireObject(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ApiValidationError("INVALID_BODY", "Request body must be a JSON object.");
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

function parseHistory(value: unknown) {
  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new ApiValidationError(
      "INVALID_HISTORY",
      "history must be an array.",
    );
  }

  if (value.length > DEMO_MAX_HISTORY_ITEMS) {
    throw new ApiValidationError(
      "HISTORY_TOO_LONG",
      "history is too long.",
    );
  }

  return value.map((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new ApiValidationError(
        "INVALID_HISTORY",
        `history[${index}] must be an object.`,
      );
    }

    const record = item as Record<string, unknown>;
    const role = record.role;

    if (role !== "user" && role !== "assistant") {
      throw new ApiValidationError(
        "INVALID_HISTORY",
        `history[${index}].role must be user or assistant.`,
      );
    }

    const content = requireNonEmptyString(
      record.content,
      `history[${index}].content`,
      validationLimits.maxMessageLength,
    );

    return { role, content };
  });
}

export function parseDemoChatPayload(body: unknown) {
  const payload = requireObject(body);

  const sessionId = requireNonEmptyString(
    payload.sessionId,
    "sessionId",
    MAX_SESSION_ID_LENGTH,
  );
  const message = requireNonEmptyString(
    payload.message,
    "message",
    validationLimits.maxMessageLength,
  );
  const history = parseHistory(payload.history);

  return {
    sessionId,
    message,
    history,
  };
}

export type DemoHistoryMessage = ReturnType<
  typeof parseDemoChatPayload
>["history"][number];
