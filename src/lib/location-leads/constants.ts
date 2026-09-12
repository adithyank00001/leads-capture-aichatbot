export const MAPS_LEAD_CREDIT_LIMIT = 100_000;

export const MAPS_SEARCH_DEPTHS = [50, 100, 200, 500, 700] as const;

export type MapsSearchDepth = (typeof MAPS_SEARCH_DEPTHS)[number];

export const MAPS_SEARCH_STATUSES = [
  "queued",
  "submitted",
  "completed",
  "failed",
] as const;

export type MapsSearchStatus = (typeof MAPS_SEARCH_STATUSES)[number];

export const LEAD_CREDITS_BADGE_LABEL = "100,000 Lead Credits";

export const DEPTH_DROPDOWN_LABEL = "Database Lead Search Depth (Max Leads/Searches)";

export const DATA_EXPIRES_BADGE = "Data expires in 24 hours.";

export function isMapsSearchDepth(value: unknown): value is MapsSearchDepth {
  return (
    typeof value === "number" &&
    (MAPS_SEARCH_DEPTHS as readonly number[]).includes(value)
  );
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
