import "server-only";

type ServiceStatus = "configured" | "not_configured";

function readOptionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function readIntEnv(name: string, fallback: number): number {
  const raw = readOptionalEnv(name);
  if (!raw) {
    return fallback;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readFloatEnv(name: string, fallback: number): number {
  const raw = readOptionalEnv(name);
  if (!raw) {
    return fallback;
  }

  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Server-only environment values. Never import this file from client components.
 */
export const serverEnv = {
  supabaseUrl: readOptionalEnv("SUPABASE_URL"),
  supabaseServiceRoleKey: readOptionalEnv("SUPABASE_SERVICE_ROLE_KEY"),
  openRouterApiKey: readOptionalEnv("OPENROUTER_API_KEY"),
  openRouterModel: readOptionalEnv("OPENROUTER_MODEL") ?? "openai/gpt-4o-mini",
  openRouterEmbeddingModel:
    readOptionalEnv("OPENROUTER_EMBEDDING_MODEL") ??
    "openai/text-embedding-3-small",
  embeddingDimensions: readIntEnv("OPENROUTER_EMBEDDING_DIMENSIONS", 1536),
  ragTopK: readIntEnv("RAG_TOP_K", 3),
  ragSimilarityThreshold: readFloatEnv("RAG_SIMILARITY_THRESHOLD", 0.7),
  gasMasterWebAppUrl: readOptionalEnv("GAS_MASTER_WEB_APP_URL"),
  gasIngestionWebAppUrl: readOptionalEnv("GAS_INGESTION_WEB_APP_URL"),
  gasIngestionHmacSecret: readOptionalEnv("GAS_INGESTION_HMAC_SECRET"),
  minUsableWebsiteTextChars: readIntEnv("MIN_USABLE_WEBSITE_TEXT_CHARS", 300),
  appUrl: readOptionalEnv("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3000",
} as const;

export function getServiceStatus(): {
  supabase: ServiceStatus;
  ai: ServiceStatus;
} {
  const supabaseConfigured = Boolean(
    serverEnv.supabaseUrl && serverEnv.supabaseServiceRoleKey,
  );
  const aiConfigured = Boolean(serverEnv.openRouterApiKey);

  return {
    supabase: supabaseConfigured ? "configured" : "not_configured",
    ai: aiConfigured ? "configured" : "not_configured",
  };
}
