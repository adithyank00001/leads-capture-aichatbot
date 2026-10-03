/** Meta click-id helpers (shared client + server). Format: fb.{subdomainIndex}.{creationTimeMs}.{fbclid} */

const FBC_COOKIE = "_fbc";
const FBP_COOKIE = "_fbp";
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

/**
 * Unwrap encodeURIComponent transport layers (%25 → %) only.
 * Stops before decoding the fbclid itself (%2F must stay %2F, not /).
 */
export function unwrapTransportEncoding(value: string): string {
  let current = value;
  while (current.includes("%25")) {
    let decoded: string;
    try {
      decoded = decodeURIComponent(current);
    } catch {
      break;
    }
    if (decoded === current) {
      break;
    }
    current = decoded;
  }
  return current;
}

/**
 * _fbc must stay plain (Meta compares fbclid exactly).
 * Older builds / Meta Pixel may stack encodeURIComponent (%2F → %252F → %25252F…).
 */
export function normalizeFbcCookieValue(
  raw: string | null | undefined,
): string | undefined {
  if (!raw?.trim()) {
    return undefined;
  }

  const value = unwrapTransportEncoding(raw.trim());
  return isValidFbc(value) ? value : undefined;
}

function isSafeFbcCookieValue(value: string): boolean {
  // Cookie values cannot contain ";" (it ends the cookie). Keep _fbc plain otherwise.
  return isValidFbc(value) && !value.includes(";") && !/[\r\n]/.test(value);
}

export function extractFbclidFromUrl(
  url: string | null | undefined,
): string | undefined {
  if (!url?.trim()) {
    return undefined;
  }

  // Meta rejects a decoded/modified fbclid — keep the raw query value (no URLSearchParams).
  // If the URL was over-encoded (%252F), unwrap transport layers only.
  const match = /(?:^|[?&#])fbclid=([^&#]+)/i.exec(url);
  const fbclid = match?.[1]?.trim();
  if (!fbclid) {
    return undefined;
  }
  return unwrapTransportEncoding(fbclid) || undefined;
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

function readRawBrowserCookie(name: string): string | undefined {
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
    return raw || undefined;
  }
  return undefined;
}

function readBrowserFbpCookie(): string | undefined {
  const raw = readRawBrowserCookie(FBP_COOKIE);
  if (!raw) {
    return undefined;
  }
  // _fbp is digits-only; decode is safe and matches older cookie writes.
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

const FBP_PATTERN = /^fb\.\d+\.\d+\.\d+$/;

export function isValidFbp(value: string | null | undefined): value is string {
  if (!value) return false;
  const trimmed = value.trim();
  return (
    trimmed.length > 0 && trimmed.length <= 512 && FBP_PATTERN.test(trimmed)
  );
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
  const rawCookie = readRawBrowserCookie(FBC_COOKIE);
  const normalizedCookie = normalizeFbcCookieValue(rawCookie);
  const resolved = resolveFbc({
    cookieFbc: normalizedCookie,
    urls: [pageUrl],
  });

  if (!resolved || !isSafeFbcCookieValue(resolved)) {
    return undefined;
  }

  // Rewrite when missing, logical value changed, or legacy %25 encoding is still stored.
  if (rawCookie === resolved) {
    return resolved;
  }

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  // Plain write — never encodeURIComponent (that created %252525… loops).
  document.cookie = `${FBC_COOKIE}=${resolved}; Path=/; Max-Age=${FBC_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;

  return resolved;
}

/**
 * Read browser Meta cookies after ensuring _fbc from fbclid.
 * Used so CAPI gets fbp/fbc even if Cookie header is incomplete.
 */
export function readBrowserMetaClickIds(): {
  fbp?: string;
  fbc?: string;
} {
  if (typeof window === "undefined") {
    return {};
  }

  let fbc: string | undefined;
  try {
    fbc = ensureBrowserFbcCookie();
  } catch {
    fbc = undefined;
  }

  const fbpRaw = readBrowserFbpCookie()?.trim();
  const fbp = isValidFbp(fbpRaw) ? fbpRaw : undefined;
  const resolvedFbc = isValidFbc(fbc) ? fbc : undefined;

  return {
    ...(fbp ? { fbp } : {}),
    ...(resolvedFbc ? { fbc: resolvedFbc } : {}),
  };
}
