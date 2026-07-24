import "server-only";

type ServiceStatus = "configured" | "not_configured";

function readOptionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

/**
 * Server-only environment values. Never import this file from client components.
 */
export const serverEnv = {
  supabaseUrl: readOptionalEnv("SUPABASE_URL"),
  supabaseServiceRoleKey: readOptionalEnv("SUPABASE_SERVICE_ROLE_KEY"),
  openRouterApiKey: readOptionalEnv("OPENROUTER_API_KEY"),
  openRouterModel: readOptionalEnv("OPENROUTER_MODEL") ?? "openai/gpt-4o-mini",
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
