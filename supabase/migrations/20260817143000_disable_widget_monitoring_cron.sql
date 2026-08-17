-- Hard-disable automatic widget monitoring scheduler.
-- Preserves all monitor tables/history for future re-enable.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'dispatch-widget-monitor-tick'
  ) THEN
    PERFORM cron.unschedule('dispatch-widget-monitor-tick');
  END IF;
END $$;

UPDATE public.widget_monitor_settings
SET
  tick_url = NULL,
  cron_secret = NULL,
  updated_at = now()
WHERE id = 1;

UPDATE public.bot_widget_monitors
SET
  in_progress_at = NULL,
  current_check_id = NULL,
  check_heartbeat_at = NULL,
  updated_at = now()
WHERE in_progress_at IS NOT NULL;
