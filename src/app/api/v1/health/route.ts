import { apiSuccess } from "@/lib/api-response";
import { publicConfig } from "@/lib/config";
import { getServiceStatus } from "@/lib/env.server";
import { checkSupabaseConnection } from "@/lib/supabase/admin";

export async function GET() {
  const services = getServiceStatus();
  const supabase = await checkSupabaseConnection();

  return apiSuccess({
    status: "healthy",
    version: "0.1.0",
    app: publicConfig.appName,
    defaultBotId: publicConfig.defaultBotId,
    timestamp: new Date().toISOString(),
    services: {
      api: "up",
      supabase: services.supabase,
      ai: services.ai,
    },
    database: {
      configured: services.supabase === "configured",
      connected: supabase.connected,
      status: supabase.connected ? "connected" : supabase.reason,
      message: "message" in supabase ? supabase.message : undefined,
    },
  });
}
