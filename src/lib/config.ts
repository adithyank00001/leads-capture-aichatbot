/**
 * Public configuration safe to use in the browser.
 * Never put secret keys in this file.
 */
export const publicConfig = {
  appName: "Leady AI",
  productTagline: "Turn website visitors into qualified leads",
  apiVersion: "v1",
  defaultBotId: process.env.NEXT_PUBLIC_DEFAULT_BOT_ID ?? "test-business-1",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
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
