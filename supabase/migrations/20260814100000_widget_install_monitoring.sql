-- Widget install monitoring: state, daily checks, events, scheduler dispatch.
-- Does not alter existing cron jobs (message cleanup, website build sweep).

CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.bot_widget_monitors (
  bot_id text PRIMARY KEY REFERENCES public.bots (bot_id) ON DELETE CASCADE,
  domain text,
  install_status text NOT NULL DEFAULT 'never_seen'
    CHECK (install_status IN ('never_seen', 'installed', 'removed')),
  purchase_at timestamptz NOT NULL,
  install_window_end_at timestamptz NOT NULL,
  first_installed_at timestamptz,
  active_monitoring_start_at timestamptz,
  active_monitoring_end_at timestamptz,
  last_seen_at timestamptz,
  last_checked_at timestamptz,
  last_error text,
  slot_minute int CHECK (slot_minute IS NULL OR (slot_minute >= 0 AND slot_minute <= 1439)),
  next_check_at timestamptz,
  in_progress_at timestamptz,
  current_check_id uuid,
  check_heartbeat_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_bot_widget_monitors_slot_active
  ON public.bot_widget_monitors (slot_minute)
  WHERE slot_minute IS NOT NULL AND next_check_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bot_widget_monitors_due
  ON public.bot_widget_monitors (next_check_at)
  WHERE next_check_at IS NOT NULL AND in_progress_at IS NULL;

CREATE TABLE IF NOT EXISTS public.bot_widget_monitor_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id text NOT NULL REFERENCES public.bots (bot_id) ON DELETE CASCADE,
  check_id uuid NOT NULL UNIQUE,
  website_url text NOT NULL,
  result text CHECK (result IS NULL OR result IN ('installed', 'missing', 'check_error')),
  page_ok boolean,
  heartbeat_matched boolean NOT NULL DEFAULT false,
  visitor_heartbeat_protected boolean NOT NULL DEFAULT false,
  error_message text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bot_widget_monitor_checks_bot_started
  ON public.bot_widget_monitor_checks (bot_id, started_at DESC);

CREATE TABLE IF NOT EXISTS public.bot_widget_monitor_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id text NOT NULL REFERENCES public.bots (bot_id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('installed', 'removed', 'reinstalled')),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  check_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bot_widget_monitor_events_bot
  ON public.bot_widget_monitor_events (bot_id, occurred_at DESC);

CREATE TABLE IF NOT EXISTS public.widget_monitor_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  tick_url text,
  cron_secret text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.widget_monitor_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.bot_widget_monitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_widget_monitor_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_widget_monitor_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.widget_monitor_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY bot_widget_monitors_select_own ON public.bot_widget_monitors
  FOR SELECT TO authenticated
  USING (
    bot_id IN (
      SELECT b.bot_id
      FROM public.bots b
      JOIN public.customers c ON c.id = b.customer_id
      WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY bot_widget_monitor_checks_select_own ON public.bot_widget_monitor_checks
  FOR SELECT TO authenticated
  USING (
    bot_id IN (
      SELECT b.bot_id
      FROM public.bots b
      JOIN public.customers c ON c.id = b.customer_id
      WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY bot_widget_monitor_events_select_own ON public.bot_widget_monitor_events
  FOR SELECT TO authenticated
  USING (
    bot_id IN (
      SELECT b.bot_id
      FROM public.bots b
      JOIN public.customers c ON c.id = b.customer_id
      WHERE c.user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.widget_monitor_next_slot_at(p_slot_minute int, p_from timestamptz DEFAULT now())
RETURNS timestamptz
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT
    date_trunc('day', p_from AT TIME ZONE 'utc') AT TIME ZONE 'utc'
    + make_interval(mins => p_slot_minute)
    + CASE
        WHEN (
          date_trunc('day', p_from AT TIME ZONE 'utc') AT TIME ZONE 'utc'
          + make_interval(mins => p_slot_minute)
        ) <= p_from
        THEN interval '1 day'
        ELSE interval '0'
      END;
$$;

CREATE OR REPLACE FUNCTION public.widget_monitor_allocate_slot(p_preferred int)
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
  v_offset int;
  v_candidate int;
BEGIN
  FOR v_offset IN 0..1439 LOOP
    IF v_offset = 0 THEN
      v_candidate := ((p_preferred % 1440) + 1440) % 1440;
    ELSIF v_offset % 2 = 1 THEN
      v_candidate := ((p_preferred + ((v_offset + 1) / 2)) % 1440 + 1440) % 1440;
    ELSE
      v_candidate := ((p_preferred - (v_offset / 2)) % 1440 + 1440) % 1440;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM public.bot_widget_monitors
      WHERE slot_minute = v_candidate
        AND next_check_at IS NOT NULL
    ) THEN
      RETURN v_candidate;
    END IF;
  END LOOP;

  RETURN ((p_preferred % 1440) + 1440) % 1440;
END;
$$;

CREATE OR REPLACE FUNCTION public.enroll_bot_widget_monitor(p_bot_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_granted timestamptz;
  v_domain text;
  v_has_lifetime boolean;
  v_row public.bot_widget_monitors%ROWTYPE;
  v_preferred int;
  v_slot int;
  v_window_end timestamptz;
  v_now timestamptz := now();
  v_should_schedule boolean := false;
BEGIN
  SELECT c.has_lifetime_access, c.lifetime_access_granted_at
  INTO v_has_lifetime, v_granted
  FROM public.bots b
  JOIN public.customers c ON c.id = b.customer_id
  WHERE b.bot_id = p_bot_id;

  IF NOT FOUND OR v_has_lifetime IS NOT TRUE OR v_granted IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_lifetime');
  END IF;

  SELECT d.domain
  INTO v_domain
  FROM public.bot_allowed_domains d
  WHERE d.bot_id = p_bot_id
  ORDER BY d.created_at
  LIMIT 1;

  v_window_end := v_granted + interval '30 days';

  INSERT INTO public.bot_widget_monitors (
    bot_id,
    domain,
    purchase_at,
    install_window_end_at
  )
  VALUES (p_bot_id, v_domain, v_granted, v_window_end)
  ON CONFLICT (bot_id) DO UPDATE
  SET
    domain = EXCLUDED.domain,
    purchase_at = EXCLUDED.purchase_at,
    install_window_end_at = EXCLUDED.install_window_end_at,
    updated_at = now()
  RETURNING * INTO v_row;

  IF v_row.completed_at IS NOT NULL THEN
    UPDATE public.bot_widget_monitors
    SET
      domain = v_domain,
      slot_minute = NULL,
      next_check_at = NULL,
      in_progress_at = NULL,
      current_check_id = NULL,
      updated_at = now()
    WHERE bot_id = p_bot_id;
    RETURN jsonb_build_object('ok', true, 'reason', 'already_completed');
  END IF;

  IF v_row.first_installed_at IS NOT NULL
     AND v_row.active_monitoring_end_at IS NOT NULL
     AND v_now >= v_row.active_monitoring_end_at THEN
    UPDATE public.bot_widget_monitors
    SET
      domain = v_domain,
      slot_minute = NULL,
      next_check_at = NULL,
      in_progress_at = NULL,
      current_check_id = NULL,
      completed_at = COALESCE(completed_at, v_now),
      updated_at = now()
    WHERE bot_id = p_bot_id;
    RETURN jsonb_build_object('ok', true, 'reason', 'active_window_ended');
  END IF;

  IF v_row.first_installed_at IS NULL AND v_now >= v_window_end THEN
    UPDATE public.bot_widget_monitors
    SET
      domain = v_domain,
      slot_minute = NULL,
      next_check_at = NULL,
      in_progress_at = NULL,
      current_check_id = NULL,
      completed_at = COALESCE(completed_at, v_now),
      updated_at = now()
    WHERE bot_id = p_bot_id;
    RETURN jsonb_build_object('ok', true, 'reason', 'install_window_ended');
  END IF;

  IF v_domain IS NULL THEN
    UPDATE public.bot_widget_monitors
    SET
      domain = NULL,
      slot_minute = NULL,
      next_check_at = NULL,
      in_progress_at = NULL,
      current_check_id = NULL,
      updated_at = now()
    WHERE bot_id = p_bot_id;
    RETURN jsonb_build_object('ok', true, 'reason', 'waiting_for_domain');
  END IF;

  v_should_schedule :=
    (v_row.first_installed_at IS NULL AND v_now < v_window_end)
    OR (
      v_row.first_installed_at IS NOT NULL
      AND v_row.active_monitoring_end_at IS NOT NULL
      AND v_now < v_row.active_monitoring_end_at
    );

  IF NOT v_should_schedule THEN
    UPDATE public.bot_widget_monitors
    SET
      domain = v_domain,
      slot_minute = NULL,
      next_check_at = NULL,
      updated_at = now()
    WHERE bot_id = p_bot_id;
    RETURN jsonb_build_object('ok', true, 'reason', 'not_in_window');
  END IF;

  v_slot := v_row.slot_minute;
  IF v_slot IS NULL THEN
    v_preferred := (EXTRACT(HOUR FROM v_granted AT TIME ZONE 'utc')::int * 60)
      + EXTRACT(MINUTE FROM v_granted AT TIME ZONE 'utc')::int;
    v_slot := public.widget_monitor_allocate_slot(v_preferred);
  END IF;

  UPDATE public.bot_widget_monitors
  SET
    domain = v_domain,
    slot_minute = v_slot,
    next_check_at = COALESCE(next_check_at, v_now),
    updated_at = now()
  WHERE bot_id = p_bot_id;

  RETURN jsonb_build_object('ok', true, 'reason', 'scheduled', 'slot_minute', v_slot);
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_due_widget_monitor_check()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bot_id text;
  v_check_id uuid := gen_random_uuid();
  v_domain text;
  v_url text;
BEGIN
  SELECT m.bot_id
  INTO v_bot_id
  FROM public.bot_widget_monitors m
  WHERE m.next_check_at IS NOT NULL
    AND m.next_check_at <= now()
    AND m.in_progress_at IS NULL
    AND m.completed_at IS NULL
    AND m.domain IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.bot_allowed_domains d WHERE d.bot_id = m.bot_id
    )
  ORDER BY m.next_check_at
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF v_bot_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT d.domain INTO v_domain
  FROM public.bot_allowed_domains d
  WHERE d.bot_id = v_bot_id
  ORDER BY d.created_at
  LIMIT 1;

  SELECT s.website_url INTO v_url
  FROM public.bot_website_sources s
  WHERE s.bot_id = v_bot_id;

  IF v_url IS NULL OR btrim(v_url) = '' THEN
    v_url := 'https://' || v_domain;
  END IF;

  UPDATE public.bot_widget_monitors
  SET
    in_progress_at = now(),
    current_check_id = v_check_id,
    check_heartbeat_at = NULL,
    last_error = NULL,
    updated_at = now()
  WHERE bot_id = v_bot_id;

  INSERT INTO public.bot_widget_monitor_checks (
    bot_id,
    check_id,
    website_url
  ) VALUES (
    v_bot_id,
    v_check_id,
    v_url
  );

  RETURN jsonb_build_object(
    'botId', v_bot_id,
    'checkId', v_check_id,
    'websiteUrl', v_url,
    'domain', v_domain
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.fail_stale_widget_monitor_checks(p_stale_minutes int DEFAULT 12)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row record;
  v_count int := 0;
BEGIN
  FOR v_row IN
    SELECT bot_id, current_check_id, slot_minute
    FROM public.bot_widget_monitors
    WHERE in_progress_at IS NOT NULL
      AND in_progress_at < now() - make_interval(mins => p_stale_minutes)
  LOOP
    UPDATE public.bot_widget_monitor_checks
    SET
      result = 'check_error',
      page_ok = false,
      error_message = 'Timed out waiting for the browser check.',
      completed_at = now()
    WHERE check_id = v_row.current_check_id
      AND result IS NULL;

    UPDATE public.bot_widget_monitors
    SET
      in_progress_at = NULL,
      current_check_id = NULL,
      last_checked_at = now(),
      last_error = 'check_timeout',
      next_check_at = CASE
        WHEN slot_minute IS NULL THEN NULL
        ELSE public.widget_monitor_next_slot_at(slot_minute, now())
      END,
      updated_at = now()
    WHERE bot_id = v_row.bot_id;

    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object('failed', v_count);
END;
$$;

CREATE OR REPLACE FUNCTION public.dispatch_widget_monitor_tick()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, net
AS $$
DECLARE
  v_settings public.widget_monitor_settings%ROWTYPE;
  v_request_id bigint;
BEGIN
  PERFORM public.fail_stale_widget_monitor_checks(12);

  SELECT * INTO v_settings FROM public.widget_monitor_settings WHERE id = 1;

  IF v_settings.tick_url IS NULL OR btrim(v_settings.tick_url) = ''
     OR v_settings.cron_secret IS NULL OR btrim(v_settings.cron_secret) = '' THEN
    RETURN jsonb_build_object('ok', true, 'skipped', true, 'reason', 'not_configured');
  END IF;

  SELECT net.http_post(
    url := v_settings.tick_url,
    body := jsonb_build_object('source', 'pg_cron'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_settings.cron_secret
    ),
    timeout_milliseconds := 8000
  ) INTO v_request_id;

  RETURN jsonb_build_object('ok', true, 'requestId', v_request_id);
END;
$$;

REVOKE ALL ON FUNCTION public.enroll_bot_widget_monitor(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_due_widget_monitor_check() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fail_stale_widget_monitor_checks(int) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.dispatch_widget_monitor_tick() FROM PUBLIC;
REVOKE ALL ON TABLE public.widget_monitor_settings FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.widget_monitor_settings TO service_role;

GRANT EXECUTE ON FUNCTION public.enroll_bot_widget_monitor(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_due_widget_monitor_check() TO service_role;
GRANT EXECUTE ON FUNCTION public.fail_stale_widget_monitor_checks(int) TO service_role;
GRANT EXECUTE ON FUNCTION public.dispatch_widget_monitor_tick() TO service_role;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'dispatch-widget-monitor-tick'
  ) THEN
    PERFORM cron.unschedule('dispatch-widget-monitor-tick');
  END IF;
END $$;

SELECT cron.schedule(
  'dispatch-widget-monitor-tick',
  '* * * * *',
  $$SELECT public.dispatch_widget_monitor_tick();$$
);
