import "server-only";

import { isValidFbc, resolveFbc } from "@/lib/meta/fbc";

/** Dodo metadata values max 500 chars. */
export const META_ATTR_MAX_VALUE_LEN = 500;

export const META_ATTR_KEYS = {
  fbp: "meta_fbp",
  fbc: "meta_fbc",
  clientIp: "meta_cip",
  userAgent: "meta_ua",
} as const;

export type MetaAttribution = {
  fbp?: string;
  fbc?: string;
  clientIp?: string;
  userAgent?: string;
};

export type MetaAttributionOptions = {
  /** Page URL from the browser (may still contain fbclid). */
  eventSourceUrl?: string | null;
};

function truncateMetaValue(value: string): string {
  if (value.length <= META_ATTR_MAX_VALUE_LEN) {
    return value;
  }
  return value.slice(0, META_ATTR_MAX_VALUE_LEN);
}

function parseCookieValue(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) {
    return undefined;
  }

  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq <= 0) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    if (key !== name) {
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

/** Strip brackets and unwrap IPv4-mapped IPv6 (::ffff:a.b.c.d → a.b.c.d). */
function normalizeClientIp(raw: string): string {
  let ip = raw.trim();
  if (ip.startsWith("[") && ip.endsWith("]")) {
    ip = ip.slice(1, -1);
  }
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(ip);
  if (mapped?.[1]) {
    return mapped[1];
  }
  return ip;
}

function isIpv6Address(ip: string): boolean {
  // Real IPv6 has colons; IPv4-mapped forms are normalized to IPv4 first.
  return ip.includes(":");
}

function isIpv4Address(ip: string): boolean {
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(ip);
}

/**
 * Collect client IP candidates from proxy headers (leftmost = original client).
 * Meta prefers IPv6 when the Pixel saw IPv6 for the same visitor.
 */
function collectClientIpCandidates(headers: Headers): string[] {
  const candidates: string[] = [];
  const seen = new Set<string>();

  function push(raw: string | null | undefined) {
    if (!raw?.trim()) return;
    for (const part of raw.split(",")) {
      const ip = normalizeClientIp(part);
      if (!ip || seen.has(ip)) continue;
      // Skip obvious placeholders
      if (ip === "unknown" || ip === "null") continue;
      seen.add(ip);
      candidates.push(ip);
    }
  }

  push(headers.get("x-forwarded-for"));
  push(headers.get("x-vercel-forwarded-for"));
  push(headers.get("cf-connecting-ip"));
  push(headers.get("x-real-ip"));

  return candidates;
}

/**
 * Prefer IPv6 for Meta CAPI when present (matches Pixel for IPv6-enabled users).
 * Falls back to IPv4 so existing traffic keeps working.
 */
function getClientIpFromHeaders(headers: Headers): string | undefined {
  const candidates = collectClientIpCandidates(headers);
  if (candidates.length === 0) {
    return undefined;
  }

  const ipv6 = candidates.find(isIpv6Address);
  if (ipv6) {
    return ipv6;
  }

  const ipv4 = candidates.find(isIpv4Address);
  return ipv4 ?? candidates[0];
}

/**
 * Read Meta click/browser cookies + request IP/UA for CAPI matching.
 * Builds fbc from fbclid in eventSourceUrl / request URL / Referer when _fbc is missing.
 * Client IP prefers IPv6 when the proxy headers include one (Meta Events quality tip).
 * Safe to store in Dodo checkout metadata (values truncated to 500 chars).
 */
export function getMetaAttributionFromRequest(
  request: Request,
  options: MetaAttributionOptions = {},
): MetaAttribution {
  const cookieHeader = request.headers.get("cookie");
  const fbp = parseCookieValue(cookieHeader, "_fbp");
  const cookieFbc = parseCookieValue(cookieHeader, "_fbc");
  const clientIp = getClientIpFromHeaders(request.headers);
  const userAgent = request.headers.get("user-agent")?.trim() || undefined;

  const fbc = resolveFbc({
    cookieFbc,
    urls: [
      options.eventSourceUrl,
      request.url,
      request.headers.get("referer"),
    ],
  });

  return {
    ...(fbp ? { fbp: truncateMetaValue(fbp) } : {}),
    ...(fbc ? { fbc: truncateMetaValue(fbc) } : {}),
    ...(clientIp ? { clientIp: truncateMetaValue(clientIp) } : {}),
    ...(userAgent ? { userAgent: truncateMetaValue(userAgent) } : {}),
  };
}

/** Flatten attribution into Dodo metadata string values. */
export function metaAttributionToMetadata(
  attribution: MetaAttribution,
): Record<string, string> {
  const metadata: Record<string, string> = {};

  if (attribution.fbp) {
    metadata[META_ATTR_KEYS.fbp] = truncateMetaValue(attribution.fbp);
  }
  if (attribution.fbc) {
    metadata[META_ATTR_KEYS.fbc] = truncateMetaValue(attribution.fbc);
  }
  if (attribution.clientIp) {
    metadata[META_ATTR_KEYS.clientIp] = truncateMetaValue(attribution.clientIp);
  }
  if (attribution.userAgent) {
    metadata[META_ATTR_KEYS.userAgent] = truncateMetaValue(attribution.userAgent);
  }

  return metadata;
}

function readMetadataString(
  metadata: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = metadata[key];
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed || undefined;
}

/** Restore attribution fields from payment webhook metadata. */
export function metaAttributionFromMetadata(
  metadata: Record<string, unknown>,
): MetaAttribution {
  const fbp = readMetadataString(metadata, META_ATTR_KEYS.fbp);
  const fbc = readMetadataString(metadata, META_ATTR_KEYS.fbc);
  const clientIp = readMetadataString(metadata, META_ATTR_KEYS.clientIp);
  const userAgent = readMetadataString(metadata, META_ATTR_KEYS.userAgent);

  return {
    ...(fbp ? { fbp } : {}),
    ...(fbc && isValidFbc(fbc) ? { fbc } : {}),
    ...(clientIp ? { clientIp } : {}),
    ...(userAgent ? { userAgent } : {}),
  };
}
