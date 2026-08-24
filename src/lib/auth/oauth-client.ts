"use client";

export function buildClientOAuthCallbackUrl(_nextPath?: string) {
  // Must match Supabase Redirect URLs exactly (no ?next=...).
  // Post-login destination is chosen in /auth/callback from account access.
  return `${window.location.origin}/auth/callback`;
}
