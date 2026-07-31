import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { ensureWidgetSettingsForBot } from "@/lib/db/bot-widget-settings";
import type { WidgetSettings } from "@/lib/widget/types";

export async function getWidgetSettingsForEmbed(botId: string): Promise<WidgetSettings> {
  const supabase = getSupabaseAdmin();
  return ensureWidgetSettingsForBot(supabase, botId);
}
