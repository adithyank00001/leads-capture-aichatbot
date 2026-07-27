import { normalizeDomain } from "@/lib/security/domain";

const NON_PAGE_PROTOCOLS = ["mailto:", "tel:", "javascript:", "data:"];
const FILE_EXTENSION_PATTERN =
  /\.(pdf|jpg|jpeg|png|gif|webp|svg|zip|rar|mp4|mp3|doc|docx|xls|xlsx|ppt|pptx)$/i;

export function normalizeWebsiteUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const withProtocol = trimmed.includes("://") ? trimmed : `https://${trimmed}`;
    const url = new URL(withProtocol);
    url.hash = "";
    return url.toString().replace(/\/$/, "") || url.toString();
  } catch {
    return null;
  }
}

export function normalizePageUrl(url: string, baseOrigin: string): string | null {
  try {
    const resolved = new URL(url, baseOrigin);
    resolved.hash = "";

    for (const key of [...resolved.searchParams.keys()]) {
      const lower = key.toLowerCase();
      if (
        lower.startsWith("utm_") ||
        lower === "fbclid" ||
        lower === "gclid" ||
        lower === "mc_cid" ||
        lower === "mc_eid"
      ) {
        resolved.searchParams.delete(key);
      }
    }

    if (resolved.pathname !== "/" && resolved.pathname.endsWith("/")) {
      resolved.pathname = resolved.pathname.slice(0, -1);
    }

    return resolved.toString();
  } catch {
    return null;
  }
}

export function getNormalizedPathKey(url: string, baseOrigin: string): string | null {
  try {
    const resolved = new URL(url, baseOrigin);
    const host = resolved.hostname.replace(/^www\./i, "").toLowerCase();
    const path =
      resolved.pathname === "/" ? "/" : resolved.pathname.replace(/\/$/, "");
    const search = resolved.search ? resolved.search : "";
    return `${host}${path}${search}`;
  } catch {
    return null;
  }
}

export function isSameWebsiteDomain(url: string, allowedDomain: string): boolean {
  const pageHost = normalizeDomain(url);
  const allowed = normalizeDomain(allowedDomain);
  if (!pageHost || !allowed) {
    return false;
  }

  return pageHost === allowed || pageHost.endsWith(`.${allowed}`);
}

export function isNonPageUrl(url: string): boolean {
  const trimmed = url.trim().toLowerCase();
  if (!trimmed || trimmed === "#") {
    return true;
  }

  if (NON_PAGE_PROTOCOLS.some((protocol) => trimmed.startsWith(protocol))) {
    return true;
  }

  try {
    const parsed = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    if (FILE_EXTENSION_PATTERN.test(parsed.pathname)) {
      return true;
    }
  } catch {
    return true;
  }

  return false;
}

export function getWebsiteOrigin(websiteUrl: string): string | null {
  try {
    return new URL(normalizeWebsiteUrl(websiteUrl) ?? websiteUrl).origin;
  } catch {
    return null;
  }
}
