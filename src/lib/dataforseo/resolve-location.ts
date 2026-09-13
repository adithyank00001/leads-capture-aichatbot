import { dataForSeoRequest } from "@/lib/dataforseo/client";
import { ApiValidationError } from "@/lib/validation/errors";

type DataForSeoLocation = {
  location_code: number;
  location_name: string;
  location_code_parent: number | null;
  country_iso_code: string;
  location_type: string;
};

type LocationsResponse = {
  status_code?: number;
  status_message?: string;
  tasks?: Array<{
    status_code?: number;
    result?: DataForSeoLocation[] | null;
  }>;
};

type ResolveInput = {
  countryIso: string;
  countryName: string;
  stateName?: string | null;
  cityName?: string | null;
};

export type ResolvedMapsLocation = {
  locationCode: number;
  locationName: string;
};

const locationsCache = new Map<
  string,
  { fetchedAt: number; locations: DataForSeoLocation[] }
>();

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function normalizeLocationKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s*,\s*/g, ",")
    .replace(/\s+/g, " ");
}

/** DataForSEO official format uses commas with no spaces: City,State,Country */
export function formatDataForSeoLocationName(parts: string[]): string {
  return parts
    .map((part) => part.trim())
    .filter(Boolean)
    .join(",");
}

async function fetchCountryLocations(
  countryIso: string,
): Promise<DataForSeoLocation[]> {
  const iso = countryIso.trim().toLowerCase();
  const cached = locationsCache.get(iso);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.locations;
  }

  const response = await dataForSeoRequest<LocationsResponse>(
    `/v3/serp/google/locations/${encodeURIComponent(iso)}`,
    { method: "GET" },
  );

  const task = response.tasks?.[0];
  const taskStatus = task?.status_code ?? response.status_code ?? 0;
  if (taskStatus !== 20000 || !task?.result) {
    throw new ApiValidationError(
      "LOCATION_LOOKUP_FAILED",
      response.status_message ??
        "Could not load supported locations for this country.",
      502,
    );
  }

  locationsCache.set(iso, {
    fetchedAt: Date.now(),
    locations: task.result,
  });

  return task.result;
}

function findExact(
  locations: DataForSeoLocation[],
  locationName: string,
): DataForSeoLocation | undefined {
  const target = normalizeLocationKey(locationName);
  return locations.find(
    (row) => normalizeLocationKey(row.location_name) === target,
  );
}

/**
 * Resolve UI country/state/city to a DataForSEO location_code.
 * Docs: location_name must match their list (e.g. "Alaska,United States").
 * Prefer location_code in task_post.
 */
export async function resolveMapsLocation(
  input: ResolveInput,
): Promise<ResolvedMapsLocation> {
  const countryIso = input.countryIso.trim();
  if (!countryIso || countryIso.length !== 2) {
    throw new ApiValidationError(
      "INVALID_LOCATION",
      "A valid country selection is required.",
      400,
    );
  }

  const countryName = input.countryName.trim();
  const stateName = input.stateName?.trim() || null;
  const cityName = input.cityName?.trim() || null;

  const locations = await fetchCountryLocations(countryIso);

  const candidates: string[] = [];
  if (cityName && stateName) {
    candidates.push(formatDataForSeoLocationName([cityName, stateName, countryName]));
  }
  if (cityName) {
    candidates.push(formatDataForSeoLocationName([cityName, countryName]));
  }
  if (stateName) {
    candidates.push(formatDataForSeoLocationName([stateName, countryName]));
  }
  candidates.push(formatDataForSeoLocationName([countryName]));

  for (const candidate of candidates) {
    const hit = findExact(locations, candidate);
    if (hit) {
      return {
        locationCode: hit.location_code,
        locationName: hit.location_name,
      };
    }
  }

  // Soft match: city prefix inside this country list.
  if (cityName) {
    const cityKey = normalizeLocationKey(cityName);
    const soft = locations.find((row) => {
      const name = normalizeLocationKey(row.location_name);
      return (
        name.startsWith(`${cityKey},`) ||
        name === cityKey ||
        name.includes(`,${cityKey},`)
      );
    });
    if (soft) {
      return {
        locationCode: soft.location_code,
        locationName: soft.location_name,
      };
    }
  }

  if (stateName) {
    const stateKey = normalizeLocationKey(stateName);
    const softState = locations.find((row) => {
      const name = normalizeLocationKey(row.location_name);
      return (
        name === `${stateKey},${normalizeLocationKey(countryName)}` ||
        (row.location_type === "State" && name.startsWith(`${stateKey},`))
      );
    });
    if (softState) {
      return {
        locationCode: softState.location_code,
        locationName: softState.location_name,
      };
    }
  }

  const countryHit = locations.find(
    (row) =>
      row.location_type === "Country" ||
      normalizeLocationKey(row.location_name) ===
        normalizeLocationKey(countryName),
  );

  if (countryHit) {
    return {
      locationCode: countryHit.location_code,
      locationName: countryHit.location_name,
    };
  }

  throw new ApiValidationError(
    "LOCATION_NOT_SUPPORTED",
    "That location is not supported yet. Try a nearby city, or only Country / State.",
    400,
  );
}
