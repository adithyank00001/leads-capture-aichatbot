import { isWidgetMonitoringEnabled } from "@/lib/monitoring/enabled";
import { signMonitorCheckPayload } from "@/lib/monitoring/hmac";
import { serverEnv } from "@/lib/env.server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function dispatchDueWidgetMonitorCheck() {
  if (!isWidgetMonitoringEnabled()) {
    return { dispatched: false as const, reason: "monitoring_disabled" as const };
  }

  const supabase = getSupabaseAdmin();
  await supabase.rpc("fail_stale_widget_monitor_checks", { p_stale_minutes: 12 });

  if (!serverEnv.gasMonitorWebAppUrl || !serverEnv.gasMonitorHmacSecret) {
    return { dispatched: false as const, reason: "not_configured" as const };
  }

  const { data, error } = await supabase.rpc("claim_due_widget_monitor_check");

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return { dispatched: false as const, reason: "none_due" as const };
  }

  const claimed = data as {
    botId: string;
    checkId: string;
    websiteUrl: string;
    domain: string;
  };

  const completeUrl = `${serverEnv.appUrl.replace(/\/+$/, "")}/api/internal/widget-monitor/complete`;
  const payload = signMonitorCheckPayload({
    action: "monitor_check",
    checkId: claimed.checkId,
    botId: claimed.botId,
    websiteUrl: claimed.websiteUrl,
    completeUrl,
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    await fetch(serverEnv.gasMonitorWebAppUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch {
    return { dispatched: true as const, accepted: false as const, checkId: claimed.checkId };
  } finally {
    clearTimeout(timeout);
  }

  return { dispatched: true as const, accepted: true as const, checkId: claimed.checkId };
}
