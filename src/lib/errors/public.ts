export const PUBLIC_ERROR_MESSAGE =
  "Something went wrong. Please try again.";

export function createErrorId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `err-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}
