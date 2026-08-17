import { isWidgetMonitoringEnabled } from "@/lib/monitoring/enabled";
import { getAllowedDomainsForBot } from "@/lib/security/domain";
import { extractHostFromUrl, isHostAllowed } from "@/lib/security/domain-shared";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { ApiValidationError } from "@/lib/validation/errors";

const HEARTBEAT_MIN_INTERVAL_MS = 2000;

export async function recordWidgetHeartbeat(input: {
  botId: string;
  pageUrl: string;
  checkId?: string | null;
}) {
  if (!isWidgetMonitoringEnabled()) {
    return { recorded: false as const };
  }

  const supabase = getSupabaseAdmin();
  const pageHost = extractHostFromUrl(input.pageUrl);

  if (!pageHost) {
    throw new ApiValidationError(
      "INVALID_PAGE_URL",
      "A valid page URL is required.",
    );
  }

  const { data: bot, error: botError } = await supabase
    .from("bots")
    .select("bot_id")
    .eq("bot_id", input.botId)
    .maybeSingle();

  if (botError) {
    throw new Error(botError.message);
  }

  if (!bot) {
    throw new ApiValidationError("BOT_NOT_FOUND", "Bot not found.", 404);
  }

  const allowedDomains = await getAllowedDomainsForBot(input.botId);

  if (allowedDomains.length === 0) {
    throw new ApiValidationError(
      "DOMAIN_NOT_CONFIGURED",
      "Add an allowed website domain in Settings before using the chatbot.",
      403,
    );
  }

  if (!isHostAllowed(pageHost, allowedDomains)) {
    throw new ApiValidationError(
      "DOMAIN_NOT_ALLOWED",
      "This chatbot can only be used from an approved website.",
      403,
    );
  }

  const now = new Date().toISOString();
  const { data: monitor } = await supabase
    .from("bot_widget_monitors")
    .select("bot_id, last_seen_at, current_check_id")
    .eq("bot_id", input.botId)
    .maybeSingle();

  if (!monitor) {
    return { recorded: false as const };
  }

  const lastSeenMs = monitor.last_seen_at
    ? new Date(monitor.last_seen_at).getTime()
    : 0;
  const skipLastSeenWrite =
    lastSeenMs > 0 && Date.now() - lastSeenMs < HEARTBEAT_MIN_INTERVAL_MS;

  if (!skipLastSeenWrite) {
    await supabase
      .from("bot_widget_monitors")
      .update({
        last_seen_at: now,
        updated_at: now,
      })
      .eq("bot_id", input.botId);
  }

  const checkId = input.checkId?.trim();

  if (checkId && monitor.current_check_id === checkId) {
    await supabase
      .from("bot_widget_monitors")
      .update({
        check_heartbeat_at: now,
        last_seen_at: now,
        updated_at: now,
      })
      .eq("bot_id", input.botId)
      .eq("current_check_id", checkId);

    await supabase
      .from("bot_widget_monitor_checks")
      .update({ heartbeat_matched: true })
      .eq("check_id", checkId)
      .is("completed_at", null);
  }

  return { recorded: true as const };
}
