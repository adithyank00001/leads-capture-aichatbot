export const TRIAL_PROVIDER_DEPTH = 100;
export const TRIAL_VISIBLE_LEADS = 10;
export const TRIAL_TTL_MS = 2 * 60 * 60 * 1000;
export const TRIAL_TOKEN_BYTES = 18;

export const TRIAL_DEPTH_HELPER =
  "Trial: only 10 leads with phone numbers. Export and other details stay locked.";

export const TRIAL_EXPORT_LOCKED_MESSAGE =
  "Export is not available on trial. Buy lifetime access to unlock.";

export const TRIAL_OTHER_DETAILS_UNLOCK = "Unlock lifetime access to see.";

export const TRIAL_UNLOCK_GENERATE_MORE =
  "Unlock lifetime access to generate more";

export const TRIAL_UNLOCK_LIFETIME = "Unlock lifetime access";

export const TRIAL_PROCESSING_TITLE = "Generating your leads…";

export const TRIAL_PROCESSING_MESSAGE =
  "This can take about a minute. Please keep this page open.";

export const TRIAL_SEARCH_USED_MESSAGE =
  "This trial already used its one search. You can view results until the link expires.";

export const TRIAL_EXPIRED_MESSAGE =
  "This trial link has expired. Ask for a new link or buy lifetime access.";

export function trialExpiresAtIso(from = new Date()): string {
  return new Date(from.getTime() + TRIAL_TTL_MS).toISOString();
}
