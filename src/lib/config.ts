/**
 * Public configuration safe to use in the browser.
 * Never put secret keys in this file.
 */
export const publicConfig = {
  appName: "growscalex AI",
  productTagline: "Turn website visitors into qualified leads",
  apiVersion: "v1",
  defaultBotId: process.env.NEXT_PUBLIC_DEFAULT_BOT_ID ?? "test-business-1",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  lifetimeAccessPriceUsd: 369,
  lifetimeAccessOriginalPrice: 1849,
  gtmId: process.env.NEXT_PUBLIC_GTM_ID?.trim() || "GTM-NTK43VFS",
} as const;

export function getEmbedPath(botId: string) {
  return `/embed/${encodeURIComponent(botId)}`;
}

export function getApiPath(path: string) {
  return `/api/${publicConfig.apiVersion}/${path.replace(/^\//, "")}`;
}

export const EMBED_COPIED_STORAGE_PREFIX = "leady_embed_copied_";

export function getEmbedCopiedKey(botId: string) {
  return `${EMBED_COPIED_STORAGE_PREFIX}${botId}`;
}

/** Public app origin without trailing slash (for embed script URLs). */
export function getPublicAppOrigin() {
  return publicConfig.appUrl.replace(/\/+$/, "");
}
