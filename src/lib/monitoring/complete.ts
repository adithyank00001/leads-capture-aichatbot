import { isWidgetMonitoringEnabled } from "@/lib/monitoring/enabled";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { ApiValidationError } from "@/lib/validation/errors";

type InstallStatus = "never_seen" | "installed" | "removed";
type CheckResult = "installed" | "missing" | "check_error";

export async function completeWidgetMonitorCheck(input: {
  checkId: string;
  botId: string;
  pageOk: boolean;
  errorMessage?: string | null;
}) {
  if (!isWidgetMonitoringEnabled()) {
    return {
      ok: true as const,
      duplicate: false as const,
      result: null,
      monitoring_disabled: true as const,
    };
  }

  const supabase = getSupabaseAdmin();
  const now = new Date();
  const nowIso = now.toISOString();

  const { data: check, error: checkError } = await supabase
    .from("bot_widget_monitor_checks")
    .select("*")
    .eq("check_id", input.checkId)
    .eq("bot_id", input.botId)
    .maybeSingle();

  if (checkError) {
    throw new Error(checkError.message);
  }

  if (!check) {
    throw new ApiValidationError("CHECK_NOT_FOUND", "Check not found.", 404);
  }

  if (check.completed_at && check.result) {
    return { ok: true as const, duplicate: true as const, result: check.result };
  }

  const { data: monitor, error: monitorError } = await supabase
    .from("bot_widget_monitors")
    .select("*")
    .eq("bot_id", input.botId)
    .maybeSingle();

  if (monitorError) {
    throw new Error(monitorError.message);
  }

  if (!monitor) {
    throw new ApiValidationError("MONITOR_NOT_FOUND", "Monitor not found.", 404);
  }

  const heartbeatMatched = Boolean(check.heartbeat_matched || monitor.check_heartbeat_at);
  const visitorProtected =
    !heartbeatMatched &&
    Boolean(monitor.last_seen_at) &&
    new Date(monitor.last_seen_at as string).getTime() >=
      new Date(check.started_at).getTime() - 2 * 60 * 1000;

  let result: CheckResult;

  if (!input.pageOk) {
    result = "check_error";
  } else if (heartbeatMatched || visitorProtected) {
    result = "installed";
  } else {
    result = "missing";
  }

  const previousStatus = monitor.install_status as InstallStatus;
  let nextStatus = previousStatus;
  let eventType: "installed" | "removed" | "reinstalled" | null = null;
  let firstInstalledAt = monitor.first_installed_at;
  let activeStart = monitor.active_monitoring_start_at;
  let activeEnd = monitor.active_monitoring_end_at;
  let completedAt = monitor.completed_at;

  if (result === "installed") {
    const insideInstallWindow = now.getTime() < new Date(monitor.install_window_end_at).getTime();

    if (previousStatus === "never_seen") {
      nextStatus = "installed";
      if (insideInstallWindow && !firstInstalledAt) {
        firstInstalledAt = nowIso;
        activeStart = nowIso;
        activeEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
        eventType = "installed";
      }
    } else if (previousStatus === "removed") {
      nextStatus = "installed";
      eventType = "reinstalled";
    }
  } else if (result === "missing" && previousStatus === "installed") {
    nextStatus = "removed";
    eventType = "removed";
  }

  const activeEnded =
    Boolean(activeEnd) && now.getTime() >= new Date(activeEnd as string).getTime();
  const installWindowEndedNeverSeen =
    nextStatus === "never_seen" &&
    now.getTime() >= new Date(monitor.install_window_end_at).getTime();

  const shouldStop = activeEnded || installWindowEndedNeverSeen;

  await supabase
    .from("bot_widget_monitor_checks")
    .update({
      result,
      page_ok: input.pageOk,
      heartbeat_matched: heartbeatMatched,
      visitor_heartbeat_protected: visitorProtected,
      error_message: result === "check_error" ? (input.errorMessage ?? "Browser check failed.") : null,
      completed_at: nowIso,
    })
    .eq("check_id", input.checkId);

  if (eventType) {
    await supabase.from("bot_widget_monitor_events").insert({
      bot_id: input.botId,
      event_type: eventType,
      occurred_at: nowIso,
      check_id: input.checkId,
    });
  }

  await supabase
    .from("bot_widget_monitors")
    .update({
      install_status: nextStatus,
      first_installed_at: firstInstalledAt,
      active_monitoring_start_at: activeStart,
      active_monitoring_end_at: activeEnd,
      last_checked_at: nowIso,
      last_error: result === "check_error" ? (input.errorMessage ?? "check_error") : null,
      in_progress_at: null,
      current_check_id: null,
      check_heartbeat_at: null,
      slot_minute: shouldStop ? null : monitor.slot_minute,
      completed_at: shouldStop ? (completedAt ?? nowIso) : completedAt,
      updated_at: nowIso,
      ...(shouldStop ? { next_check_at: null } : {}),
    })
    .eq("bot_id", input.botId);

  if (!shouldStop) {
    const { error: scheduleError } = await supabase.rpc(
      "schedule_widget_monitor_next",
      {
        p_bot_id: input.botId,
        p_was_check_error: result === "check_error",
      },
    );

    if (scheduleError) {
      throw new Error(scheduleError.message);
    }
  }

  return { ok: true as const, duplicate: false as const, result };
}
