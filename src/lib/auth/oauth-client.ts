"use client";

import { getSafeOAuthNextPath } from "@/lib/auth/oauth";

export function buildClientOAuthCallbackUrl(nextPath?: string) {
  const safeNext = getSafeOAuthNextPath(nextPath);
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}
