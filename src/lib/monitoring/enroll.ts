import { isWidgetMonitoringEnabled } from "@/lib/monitoring/enabled";
import { serverEnv } from "@/lib/env.server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function syncWidgetMonitorDispatchSettings() {
  if (!isWidgetMonitoringEnabled()) {
    return;
  }

  const tickUrl = `${serverEnv.appUrl.replace(/\/+$/, "")}/api/internal/widget-monitor/tick`;
  const cronSecret = serverEnv.widgetMonitorCronSecret;

  if (!cronSecret) {
    return;
  }

  try {
    const supabase = getSupabaseAdmin();
    await supabase.from("widget_monitor_settings").upsert({
      id: 1,
      tick_url: tickUrl,
      cron_secret: cronSecret,
      updated_at: new Date().toISOString(),
    });
  } catch {
    return;
  }
}

export async function enrollBotWidgetMonitor(botId: string) {
  if (!isWidgetMonitoringEnabled()) {
    return;
  }

  try {
    const supabase = getSupabaseAdmin();
    await syncWidgetMonitorDispatchSettings();
    await supabase.rpc("enroll_bot_widget_monitor", { p_bot_id: botId });
  } catch {
    return;
  }
}
