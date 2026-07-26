import { ApiValidationError } from "@/lib/validation/errors";

export const SINGLE_DOMAIN_ERROR = "Only one domain is allowed.";
export const REQUIRED_DOMAIN_ERROR = "Website domain is required.";
export const INVALID_DOMAIN_ERROR =
  "Enter a valid website domain (example: stylette.com).";

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
  allowedDomains: string;
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

export function splitAllowedDomainsInput(value: string) {
  return value
    .split(",")
    .map((domain) => domain.trim())
    .filter(Boolean);
}

export function normalizeWebsiteDomainInput(value: string) {
  const trimmed = value.trim().toLowerCase();

  if (!trimmed) {
    return "";
  }

  try {
    const withProtocol = trimmed.includes("://") ? trimmed : `https://${trimmed}`;
    return new URL(withProtocol).hostname.replace(/^www\./, "");
  } catch {
    return trimmed.replace(/^www\./, "").split("/")[0] ?? "";
  }
}

export function isValidWebsiteDomain(value: string) {
  const host = normalizeWebsiteDomainInput(value);
  const domainPattern =
    /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

  return Boolean(host) && domainPattern.test(host);
}

export function parseAllowedDomainInput(value: string) {
  const domains = splitAllowedDomainsInput(value);

  if (domains.length === 0) {
    throw new ApiValidationError(
      "MISSING_DOMAIN",
      REQUIRED_DOMAIN_ERROR,
      400,
    );
  }

  if (domains.length > 1) {
    throw new ApiValidationError(
      "TOO_MANY_DOMAINS",
      SINGLE_DOMAIN_ERROR,
      400,
    );
  }

  const domain = normalizeWebsiteDomainInput(domains[0]);

  if (!isValidWebsiteDomain(domain)) {
    throw new ApiValidationError(
      "INVALID_DOMAIN",
      INVALID_DOMAIN_ERROR,
      400,
    );
  }

  return domain;
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
    allowedDomains: parseAllowedDomainInput(
      readString(payload.allowedDomains, "allowedDomains"),
    ),
  };
}
