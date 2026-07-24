import { ApiValidationError } from "@/lib/validation/errors";

export type BotSettingsInput = {
  businessName: string;
  description: string;
  location: string;
  services: string;
  pricingNotes: string;
  currentOffer: string;
  openingHours: string;
  contactMethod: string;
  extraNotes: string;
};

function readString(value: unknown, fieldName: string, required = false) {
  if (value === undefined || value === null) {
    if (required) {
      throw new ApiValidationError(
        `MISSING_${fieldName.toUpperCase()}`,
        `${fieldName} is required.`,
      );
    }
    return "";
  }

  if (typeof value !== "string") {
    throw new ApiValidationError(
      `INVALID_${fieldName.toUpperCase()}`,
      `${fieldName} must be text.`,
    );
  }

  return value.trim();
}

export function parseBotSettingsPayload(body: unknown): BotSettingsInput {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ApiValidationError("INVALID_BODY", "Request body must be a JSON object.");
  }

  const payload = body as Record<string, unknown>;
  const businessName = readString(payload.businessName, "businessName", true);

  return {
    businessName,
    description: readString(payload.description, "description"),
    location: readString(payload.location, "location"),
    services: readString(payload.services, "services"),
    pricingNotes: readString(payload.pricingNotes, "pricingNotes"),
    currentOffer: readString(payload.currentOffer, "currentOffer"),
    openingHours: readString(payload.openingHours, "openingHours"),
    contactMethod: readString(payload.contactMethod, "contactMethod"),
    extraNotes: readString(payload.extraNotes, "extraNotes"),
  };
}
