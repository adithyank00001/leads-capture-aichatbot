/** Simple email check for store checkout (email only — no other fields). */
export function normalizeStoreEmail(raw: string | null | undefined): string {
  return (raw ?? "").trim().toLowerCase();
}

export function isValidStoreEmail(raw: string | null | undefined): boolean {
  const email = normalizeStoreEmail(raw);
  if (!email || email.length > 254) return false;
  // Practical check — enough for checkout, not a full RFC parser.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
