import "server-only";

import { createHash } from "node:crypto";

/**
 * Customer match fields for Meta CAPI (hashed after normalize).
 * Phone is intentionally omitted for now.
 */
export type MetaCustomerInfo = {
  email?: string | null;
  fullName?: string | null;
  country?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
};

export type MetaBillingAddress = {
  country?: string | null;
  city?: string | null;
  state?: string | null;
  street?: string | null;
  zipcode?: string | null;
};

function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function hashNormalized(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  return sha256Hex(value);
}

/** Lowercase, trim, drop punctuation (keeps letters/numbers; UTF-8 ok). */
function normalizeNamePart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

/** Lowercase, no spaces/punctuation (Meta city rules). */
function normalizeCity(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

/** Lowercase, no spaces/punctuation (US 2-letter preferred when available). */
function normalizeState(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

/** Lowercase, no spaces/dashes; US → first 5 digits when numeric. */
function normalizeZip(value: string, countryCode?: string): string {
  const cleaned = value.trim().toLowerCase().replace(/[\s-]+/g, "");
  if ((countryCode === "us" || countryCode === "usa") && /^\d{5}/.test(cleaned)) {
    return cleaned.slice(0, 5);
  }
  return cleaned;
}

/** ISO 3166-1 alpha-2 lowercase when possible. */
function normalizeCountry(value: string): string | undefined {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return undefined;
  }
  if (/^[a-z]{2}$/.test(trimmed)) {
    return trimmed;
  }
  // Common long names → ISO (only a few we might see from checkout defaults).
  const aliases: Record<string, string> = {
    "united states": "us",
    usa: "us",
    "united arab emirates": "ae",
    uae: "ae",
    "united kingdom": "gb",
    uk: "gb",
    india: "in",
  };
  return aliases[trimmed] ?? (trimmed.length === 2 ? trimmed : undefined);
}

function normalizeEmail(email: string): string | undefined {
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes("@")) {
    return undefined;
  }
  return normalized;
}

/**
 * Split a full name for Meta fn / ln.
 * Meta only has first + last (no middle-name field).
 * Example: "John Michael Smith" → first=John, last=Smith (middle dropped).
 * Example: "Jane Doe" → first=Jane, last=Doe
 * Example: "Madonna" → first=Madonna only
 */
export function splitFullName(fullName: string | null | undefined): {
  firstName?: string;
  lastName?: string;
} {
  if (!fullName?.trim()) {
    return {};
  }

  const parts = fullName
    .trim()
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return {};
  }
  if (parts.length === 1) {
    return { firstName: parts[0] };
  }

  return {
    firstName: parts[0],
    lastName: parts[parts.length - 1],
  };
}

export function metaCustomerInfoFromDodo(input: {
  email?: string | null;
  name?: string | null;
  billing?: MetaBillingAddress | null;
}): MetaCustomerInfo {
  return {
    email: input.email ?? null,
    fullName: input.name ?? null,
    country: input.billing?.country ?? null,
    city: input.billing?.city ?? null,
    state: input.billing?.state ?? null,
    zip: input.billing?.zipcode ?? null,
  };
}

/**
 * Build Meta user_data customer fields (hashed). Does not include IP/UA/fbp/fbc.
 */
export function buildHashedCustomerUserData(
  info: MetaCustomerInfo | null | undefined,
): Record<string, string | string[]> {
  if (!info) {
    return {};
  }

  const userData: Record<string, string | string[]> = {};

  const email = info.email ? normalizeEmail(info.email) : undefined;
  const hashedEmail = hashNormalized(email);
  if (hashedEmail) {
    userData.em = [hashedEmail];
  }

  const { firstName, lastName } = splitFullName(info.fullName);
  const hashedFn = hashNormalized(
    firstName ? normalizeNamePart(firstName) : undefined,
  );
  const hashedLn = hashNormalized(
    lastName ? normalizeNamePart(lastName) : undefined,
  );
  if (hashedFn) {
    userData.fn = [hashedFn];
  }
  if (hashedLn) {
    userData.ln = [hashedLn];
  }

  const country = info.country ? normalizeCountry(info.country) : undefined;
  const hashedCountry = hashNormalized(country);
  if (hashedCountry) {
    userData.country = [hashedCountry];
  }

  const city = info.city?.trim() ? normalizeCity(info.city) : undefined;
  const hashedCity = hashNormalized(city || undefined);
  if (hashedCity) {
    userData.ct = [hashedCity];
  }

  const state = info.state?.trim() ? normalizeState(info.state) : undefined;
  const hashedState = hashNormalized(state || undefined);
  if (hashedState) {
    userData.st = [hashedState];
  }

  const zipRaw = info.zip?.trim();
  const zip = zipRaw ? normalizeZip(zipRaw, country) : undefined;
  const hashedZip = hashNormalized(zip || undefined);
  if (hashedZip) {
    userData.zp = [hashedZip];
  }

  return userData;
}
