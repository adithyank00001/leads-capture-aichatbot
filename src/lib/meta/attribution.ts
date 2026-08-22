import "server-only";

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

function getClientIpFromHeaders(headers: Headers): string | undefined {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }

  const realIp = headers.get("x-real-ip")?.trim();
  return realIp || undefined;
}

/**
 * Read Meta click/browser cookies + request IP/UA for CAPI matching.
 * Safe to store in Dodo checkout metadata (values truncated to 500 chars).
 */
export function getMetaAttributionFromRequest(request: Request): MetaAttribution {
  const cookieHeader = request.headers.get("cookie");
  const fbp = parseCookieValue(cookieHeader, "_fbp");
  const fbc = parseCookieValue(cookieHeader, "_fbc");
  const clientIp = getClientIpFromHeaders(request.headers);
  const userAgent = request.headers.get("user-agent")?.trim() || undefined;

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
    ...(fbc ? { fbc } : {}),
    ...(clientIp ? { clientIp } : {}),
    ...(userAgent ? { userAgent } : {}),
  };
}
