-- Same-day check_error retries: shared scheduler for complete.ts and stale sweep.

CREATE OR REPLACE FUNCTION public.widget_monitor_free_retry_at(
  p_bot_id text,
  p_preferred timestamptz
)
RETURNS timestamptz
LANGUAGE plpgsql
AS $$
DECLARE
  v_offset int;
  v_candidate timestamptz;
  v_day date := (p_preferred AT TIME ZONE 'utc')::date;
BEGIN
  FOR v_offset IN 0..180 LOOP
    IF v_offset = 0 THEN
      v_candidate := p_preferred;
    ELSIF v_offset % 2 = 1 THEN
      v_candidate := p_preferred + make_interval(mins => (v_offset + 1) / 2);
    ELSE
      v_candidate := p_preferred - make_interval(mins => v_offset / 2);
    END IF;

    IF (v_candidate AT TIME ZONE 'utc')::date <> v_day THEN
      CONTINUE;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM public.bot_widget_monitors m
      WHERE m.bot_id <> p_bot_id
        AND (
          (
            m.next_check_at IS NOT NULL
            AND date_trunc('minute', m.next_check_at) = date_trunc('minute', v_candidate)
          )
          OR (
            m.in_progress_at IS NOT NULL
            AND date_trunc('minute', m.in_progress_at) = date_trunc('minute', v_candidate)
          )
        )
    ) THEN
      RETURN v_candidate;
    END IF;
  END LOOP;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.schedule_widget_monitor_next(
  p_bot_id text,
  p_was_check_error boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slot int;
  v_completed timestamptz;
  v_error_count int;
  v_preferred timestamptz;
  v_next timestamptz;
  v_now timestamptz := now();
  v_reason text;
BEGIN
  SELECT slot_minute, completed_at
  INTO v_slot, v_completed
  FROM public.bot_widget_monitors
  WHERE bot_id = p_bot_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;

  IF v_completed IS NOT NULL OR v_slot IS NULL THEN
    UPDATE public.bot_widget_monitors
    SET
      next_check_at = NULL,
      in_progress_at = NULL,
      current_check_id = NULL,
      check_heartbeat_at = NULL,
      updated_at = v_now
    WHERE bot_id = p_bot_id;

    RETURN jsonb_build_object('ok', true, 'reason', 'not_scheduled', 'next_check_at', null);
  END IF;

  SELECT COUNT(*)::int
  INTO v_error_count
  FROM public.bot_widget_monitor_checks
  WHERE bot_id = p_bot_id
    AND result = 'check_error'
    AND completed_at IS NOT NULL
    AND (completed_at AT TIME ZONE 'utc')::date = (v_now AT TIME ZONE 'utc')::date;

  IF p_was_check_error AND v_error_count >= 1 AND v_error_count <= 2 THEN
    v_preferred := date_trunc('minute', v_now + interval '1 hour');

    IF (v_preferred AT TIME ZONE 'utc')::date > (v_now AT TIME ZONE 'utc')::date THEN
      v_next := public.widget_monitor_next_slot_at(v_slot, v_now);
      v_reason := 'next_day_home_slot';
    ELSE
      v_next := public.widget_monitor_free_retry_at(p_bot_id, v_preferred);
      IF v_next IS NULL THEN
        v_next := public.widget_monitor_next_slot_at(v_slot, v_now);
        v_reason := 'no_free_minute_home_slot';
      ELSE
        v_reason := 'same_day_retry';
      END IF;
    END IF;
  ELSE
    v_next := public.widget_monitor_next_slot_at(v_slot, v_now);
    v_reason := 'tomorrow_home_slot';
  END IF;

  UPDATE public.bot_widget_monitors
  SET
    next_check_at = v_next,
    in_progress_at = NULL,
    current_check_id = NULL,
    check_heartbeat_at = NULL,
    updated_at = v_now
  WHERE bot_id = p_bot_id;

  RETURN jsonb_build_object(
    'ok', true,
    'reason', v_reason,
    'next_check_at', v_next,
    'error_count_today', v_error_count
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
    SELECT bot_id, current_check_id
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
      last_checked_at = now(),
      last_error = 'check_timeout',
      updated_at = now()
    WHERE bot_id = v_row.bot_id;

    PERFORM public.schedule_widget_monitor_next(v_row.bot_id, true);

    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object('failed', v_count);
END;
$$;

REVOKE ALL ON FUNCTION public.widget_monitor_free_retry_at(text, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.schedule_widget_monitor_next(text, boolean) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.schedule_widget_monitor_next(text, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.fail_stale_widget_monitor_checks(int) TO service_role;
