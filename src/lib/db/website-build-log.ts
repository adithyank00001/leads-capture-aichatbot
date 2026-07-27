import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/admin";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type Client = SupabaseClient<Database>;

export type WebsiteBuildLogSide = "nextjs" | "gas";

export async function appendWebsiteBuildLog(
  input: {
    sourceId?: string | null;
    botId: string;
    side?: WebsiteBuildLogSide;
    step: string;
    status: string;
    message: string;
  },
  supabase?: Client,
) {
  const client = supabase ?? getSupabaseAdmin();
  const { error } = await client.from("bot_website_build_logs").insert({
    source_id: input.sourceId ?? null,
    bot_id: input.botId,
    side: input.side ?? "nextjs",
    step: input.step,
    status: input.status,
    message: input.message.slice(0, 2000),
  });

  if (error) {
    console.error("[website-build-log]", error.message);
  }
}

export async function getWebsiteBuildLogs(
  supabase: Client,
  botId: string,
  limit = 50,
) {
  const { data, error } = await supabase
    .from("bot_website_build_logs")
    .select("id, source_id, side, step, status, message, created_at")
    .eq("bot_id", botId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
