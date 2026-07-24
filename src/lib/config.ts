/**
 * Public configuration safe to use in the browser.
 * Never put secret keys in this file.
 */
export const publicConfig = {
  appName: "Chatbot MVP",
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
