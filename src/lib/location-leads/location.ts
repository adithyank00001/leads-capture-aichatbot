import { ApiValidationError } from "@/lib/validation/errors";

export type LocationInput = {
  country: string;
  state?: string | null;
  city?: string | null;
};

function cleanPart(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed) {
    return null;
  }

  // Reject obvious nonsense (only punctuation/symbols).
  if (!/[A-Za-z0-9]/.test(trimmed)) {
    return null;
  }

  return trimmed;
}

/**
 * Build display location parts for our DB.
 * DataForSEO matching uses resolveMapsLocation() with official location_code.
 */
export function buildNormalizedLocationName(input: LocationInput): {
  country: string;
  state: string | null;
  city: string | null;
  locationName: string;
} {
  const country = cleanPart(input.country);
  if (!country) {
    throw new ApiValidationError(
      "INVALID_LOCATION",
      "Country is required.",
      400,
    );
  }

  const state = cleanPart(input.state);
  const city = cleanPart(input.city);

  const parts = [city, state, country].filter(
    (part): part is string => Boolean(part),
  );

  return {
    country,
    state,
    city,
    // Temporary display value; replaced by official DataForSEO location_name after resolve.
    locationName: parts.join(", "),
  };
}
