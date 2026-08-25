/** Meta click-id helpers (shared client + server). Format: fb.{subdomainIndex}.{creationTimeMs}.{fbclid} */

const FBC_COOKIE = "_fbc";
const FBC_MAX_AGE_SECONDS = 90 * 24 * 60 * 60;
/** Meta: when generating on the server without writing a cookie, use subdomain index 1. */
const DEFAULT_SUBDOMAIN_INDEX = 1;

const FBC_PATTERN = /^fb\.\d+\.\d+\..+/;

export function isValidFbc(value: string | null | undefined): value is string {
  if (!value) {
    return false;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 && FBC_PATTERN.test(trimmed);
}

export function extractFbclidFromUrl(
  url: string | null | undefined,
): string | undefined {
  if (!url?.trim()) {
    return undefined;
  }

  try {
    const parsed = url.includes("://")
      ? new URL(url)
      : new URL(url, "https://placeholder.local");
    const fbclid = parsed.searchParams.get("fbclid")?.trim();
    return fbclid || undefined;
  } catch {
    // Fallback for odd relative / partial strings
    const match = /(?:^|[?&#])fbclid=([^&#]+)/i.exec(url);
    if (!match?.[1]) {
      return undefined;
    }
    try {
      return decodeURIComponent(match[1].replace(/\+/g, " ")).trim() || undefined;
    } catch {
      return match[1].trim() || undefined;
    }
  }
}

export function extractFbclidFromFbc(fbc: string): string | undefined {
  const parts = fbc.trim().split(".");
  // fb . subdomainIndex . creationTime . fbclid (fbclid may contain dots)
  if (parts.length < 4 || parts[0] !== "fb") {
    return undefined;
  }
  const fbclid = parts.slice(3).join(".").trim();
  return fbclid || undefined;
}

export function buildFbcFromFbclid(
  fbclid: string,
  creationTimeMs: number = Date.now(),
  subdomainIndex: number = DEFAULT_SUBDOMAIN_INDEX,
): string {
  const clean = fbclid.trim();
  const time = Number.isFinite(creationTimeMs)
    ? Math.floor(creationTimeMs)
    : Date.now();
  return `fb.${subdomainIndex}.${time}.${clean}`;
}

/**
 * Prefer a valid _fbc cookie. Else build from the first fbclid found in URLs.
 * Never invents a click id without a real fbclid / cookie.
 */
export function resolveFbc(input: {
  cookieFbc?: string | null;
  urls?: Array<string | null | undefined>;
  nowMs?: number;
}): string | undefined {
  const cookie = input.cookieFbc?.trim();
  if (isValidFbc(cookie)) {
    const cookieFbclid = extractFbclidFromFbc(cookie);
    const urlFbclid = (input.urls ?? [])
      .map((url) => extractFbclidFromUrl(url))
      .find(Boolean);

    // Same click → keep original cookie timestamp (better for Meta matching).
    if (!urlFbclid || !cookieFbclid || cookieFbclid === urlFbclid) {
      return cookie;
    }

    // New ad click in the URL → refresh fbc.
    return buildFbcFromFbclid(urlFbclid, input.nowMs ?? Date.now());
  }

  for (const url of input.urls ?? []) {
    const fbclid = extractFbclidFromUrl(url);
    if (fbclid) {
      return buildFbcFromFbclid(fbclid, input.nowMs ?? Date.now());
    }
  }

  return undefined;
}

function readBrowserCookie(name: string): string | undefined {
  if (typeof document === "undefined") {
    return undefined;
  }

  const parts = document.cookie.split(";");
  for (const part of parts) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq <= 0) {
      continue;
    }
    if (trimmed.slice(0, eq).trim() !== name) {
      continue;
    }
    const raw = trimmed.slice(eq + 1).trim();
    if (!raw) {
      return undefined;
    }
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }
  return undefined;
}

/**
 * Capture fbclid from the current page into a first-party _fbc cookie (90 days).
 * Safe to call often; only writes when needed. Returns the fbc value if known.
 */
export function ensureBrowserFbcCookie(): string | undefined {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return undefined;
  }

  const pageUrl = window.location.href;
  const resolved = resolveFbc({
    cookieFbc: readBrowserCookie(FBC_COOKIE),
    urls: [pageUrl],
  });

  if (!resolved) {
    return undefined;
  }

  const existing = readBrowserCookie(FBC_COOKIE)?.trim();
  if (existing === resolved) {
    return resolved;
  }

  const secure =
    window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${FBC_COOKIE}=${encodeURIComponent(resolved)}; Path=/; Max-Age=${FBC_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;

  return resolved;
}
