/**
 * Lightweight checks for website URL normalization rules.
 * Run: node scripts/test-website-url.mjs
 */

function normalizeWebsiteUrl(input) {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const withProtocol = trimmed.includes("://") ? trimmed : `https://${trimmed}`;
  const url = new URL(withProtocol);
  url.hash = "";
  return url.toString().replace(/\/$/, "") || url.toString();
}

function normalizePageUrl(url, baseOrigin) {
  const resolved = new URL(url, baseOrigin);
  resolved.hash = "";
  for (const key of [...resolved.searchParams.keys()]) {
    const lower = key.toLowerCase();
    if (lower.startsWith("utm_") || lower === "fbclid" || lower === "gclid") {
      resolved.searchParams.delete(key);
    }
  }
  if (resolved.pathname !== "/" && resolved.pathname.endsWith("/")) {
    resolved.pathname = resolved.pathname.slice(0, -1);
  }
  return resolved.toString();
}

function getNormalizedPathKey(url, baseOrigin) {
  const resolved = new URL(url, baseOrigin);
  const host = resolved.hostname.replace(/^www\./i, "").toLowerCase();
  const path =
    resolved.pathname === "/" ? "/" : resolved.pathname.replace(/\/$/, "");
  return `${host}${path}${resolved.search || ""}`;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(
  normalizeWebsiteUrl("example.com") === "https://example.com",
  "normalizeWebsiteUrl should add https",
);
assert(
  normalizePageUrl("https://example.com/about/?utm_source=x", "https://example.com") ===
    "https://example.com/about",
  "normalizePageUrl should strip tracking params",
);
assert(
  getNormalizedPathKey("https://www.example.com/about/", "https://example.com") ===
    "example.com/about",
  "getNormalizedPathKey should normalize host and trailing slash",
);

console.log("PASS  website url helpers");
