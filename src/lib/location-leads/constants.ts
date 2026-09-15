export const MAPS_LEAD_CREDIT_LIMIT = 100_000;

/** Max leads (search depth credits) per India calendar day (IST). */
export const MAPS_DAILY_LEADS_LIMIT = 1_000;

export const DAILY_LEADS_LIMIT_BADGE_LABEL = "1,000 Daily Search";

export const DAILY_LEADS_LIMIT_REACHED_MESSAGE =
  "You hit the 1,000 daily search limit. Credits will reset at midnight.";

/** DataForSEO Maps depth: any integer from 1 to 700. */
export const MAPS_SEARCH_DEPTH_MIN = 1;
export const MAPS_SEARCH_DEPTH_MAX = 700;
export const MAPS_SEARCH_DEPTH_DEFAULT = 50;

/** Max permanently saved leads per customer. */
export const MAPS_SAVED_LEADS_MAX = 100;

export type MapsSearchDepth = number;

export const MAPS_SEARCH_STATUSES = [
  "queued",
  "submitted",
  "completed",
  "failed",
] as const;

export type MapsSearchStatus = (typeof MAPS_SEARCH_STATUSES)[number];

export const DEPTH_INPUT_LABEL = "How many leads do you want? (1–700)";

export const DATA_EXPIRES_BADGE = "Search results expire in 24 hours.";

export const SAVED_LEADS_BADGE = `Saved leads stay until you delete them (max ${MAPS_SAVED_LEADS_MAX}).`;

export function isMapsSearchDepth(value: unknown): value is MapsSearchDepth {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= MAPS_SEARCH_DEPTH_MIN &&
    value <= MAPS_SEARCH_DEPTH_MAX
  );
}

export function parseMapsSearchDepth(value: unknown): MapsSearchDepth | null {
  const raw =
    typeof value === "string"
      ? Number(value.trim())
      : typeof value === "number"
        ? value
        : NaN;

  if (!Number.isFinite(raw)) {
    return null;
  }

  const depth = Math.trunc(raw);
  return isMapsSearchDepth(depth) ? depth : null;
}

export function getDepthCostHelperText(depth: MapsSearchDepth): string {
  return `Cost: ${depth} credits. We will run a deep query across the B2B database for up to ${depth} leads. Credits cover the processing bandwidth of the extraction engine and are deducted even if the target region has fewer matching companies.`;
}

export function getProcessingStatusLabel(status: MapsSearchStatus): string {
  if (status === "completed") {
    return "Completed";
  }
  if (status === "failed") {
    return "Failed";
  }
  return "Processing…";
}
