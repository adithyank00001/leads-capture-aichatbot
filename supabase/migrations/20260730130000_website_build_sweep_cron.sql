-- Fail stale pending pages, sweep stuck builds via pg_cron, update finalize flow

-- ---------------------------------------------------------------------------
-- RPC: fail_stale_pending_pages
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.fail_stale_pending_pages(
  p_source_id uuid,
  p_stale_minutes int DEFAULT 10
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_failed int := 0;
BEGIN
  UPDATE public.bot_website_pages
  SET
    status = 'failed',
    error_message = 'Timed out — page was never processed.',
    processing_started_at = NULL,
    updated_at = now()
  WHERE source_id = p_source_id
    AND status = 'pending'
    AND updated_at < now() - (p_stale_minutes || ' minutes')::interval;

  GET DIAGNOSTICS v_failed = ROW_COUNT;

  IF v_failed > 0 THEN
    UPDATE public.bot_website_sources
    SET
      failed_pages = (
        SELECT COUNT(*)::int
        FROM public.bot_website_pages
        WHERE source_id = p_source_id
          AND status = 'failed'
      ),
      updated_at = now()
    WHERE id = p_source_id;
  END IF;

  RETURN jsonb_build_object('failed', v_failed);
END;
$$;

REVOKE ALL ON FUNCTION public.fail_stale_pending_pages(uuid, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fail_stale_pending_pages(uuid, int) TO service_role;

-- ---------------------------------------------------------------------------
-- RPC: try_finalize_website_source (updated)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.try_finalize_website_source(
  p_source_id uuid,
  p_min_chars int DEFAULT 300,
  p_stale_minutes int DEFAULT 10
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_source public.bot_website_sources%ROWTYPE;
  v_pending int;
  v_processing int;
  v_total_chars int;
  v_failed_pages int;
  v_had_existing_chunks boolean;
  v_final_status text;
  v_error_message text;
  v_refresh_error_message text;
  v_selected_urls text[];
BEGIN
  PERFORM public.reclaim_stale_processing_pages(p_source_id, p_stale_minutes);
  PERFORM public.fail_stale_pending_pages(p_source_id, p_stale_minutes);

  SELECT *
  INTO v_source
  FROM public.bot_website_sources
  WHERE id = p_source_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('finalized', false, 'reason', 'source_not_found');
  END IF;

  IF v_source.status NOT IN ('processing', 'partial') THEN
    RETURN jsonb_build_object('finalized', false, 'reason', 'not_finalizable_status');
  END IF;

  SELECT COUNT(*)::int
  INTO v_pending
  FROM public.bot_website_pages
  WHERE source_id = p_source_id
    AND status = 'pending';

  SELECT COUNT(*)::int
  INTO v_processing
  FROM public.bot_website_pages
  WHERE source_id = p_source_id
    AND status = 'processing';

  IF v_pending > 0 OR v_processing > 0 THEN
    RETURN jsonb_build_object(
      'finalized', false,
      'reason', 'pages_incomplete',
      'pending', v_pending,
      'processing', v_processing
    );
  END IF;

  SELECT COALESCE(SUM(char_length(chunk_content)), 0)::int
  INTO v_total_chars
  FROM public.bot_website_chunks
  WHERE source_id = p_source_id;

  SELECT COUNT(*)::int
  INTO v_failed_pages
  FROM public.bot_website_pages
  WHERE source_id = p_source_id
    AND status = 'failed';

  SELECT EXISTS (
    SELECT 1
    FROM public.bot_website_chunks
    WHERE bot_id = v_source.bot_id
      AND chunk_content IS NOT NULL
      AND btrim(chunk_content) <> ''
  )
  INTO v_had_existing_chunks;

  v_final_status := 'failed';
  v_error_message := NULL;
  v_refresh_error_message := NULL;

  IF v_total_chars >= p_min_chars AND v_failed_pages = 0 THEN
    v_final_status := 'ready';
  ELSIF v_total_chars >= p_min_chars AND v_failed_pages > 0 THEN
    v_final_status := 'partial';
    v_refresh_error_message := v_failed_pages || ' page(s) failed during processing.';
  ELSIF v_total_chars < p_min_chars AND v_had_existing_chunks THEN
    v_final_status := 'partial';
    v_refresh_error_message := 'Refresh did not produce enough usable website text. Previous knowledge was kept.';
    v_error_message := 'Not enough usable website text was extracted.';
  ELSE
    v_final_status := 'failed';
    v_error_message := 'Not enough usable website text was extracted.';
  END IF;

  IF v_final_status = 'ready'
    OR (v_final_status = 'partial' AND v_total_chars >= p_min_chars) THEN
    IF v_source.selected_urls IS NOT NULL
      AND v_source.selected_urls ? 'normalized_urls' THEN
      SELECT ARRAY(
        SELECT jsonb_array_elements_text(v_source.selected_urls->'normalized_urls')
      )
      INTO v_selected_urls;
    ELSE
      v_selected_urls := ARRAY[]::text[];
    END IF;

    PERFORM public.cleanup_stale_website_pages(p_source_id, v_selected_urls);
  END IF;

  UPDATE public.bot_website_sources
  SET
    status = v_final_status,
    completed_pages = (
      SELECT COUNT(*)::int
      FROM public.bot_website_pages
      WHERE source_id = p_source_id AND status = 'completed'
    ),
    failed_pages = v_failed_pages,
    error_message = v_error_message,
    refresh_error_message = v_refresh_error_message,
    last_processed_at = now(),
    updated_at = now()
  WHERE id = p_source_id
  RETURNING *
  INTO v_source;

  RETURN jsonb_build_object(
    'finalized', true,
    'status', v_final_status,
    'total_chars', v_total_chars,
    'failed_pages', v_failed_pages
  );
END;
$$;

REVOKE ALL ON FUNCTION public.try_finalize_website_source(uuid, int, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.try_finalize_website_source(uuid, int, int) TO service_role;

-- ---------------------------------------------------------------------------
-- RPC: sweep_stuck_website_builds
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.sweep_stuck_website_builds(
  p_stale_minutes int DEFAULT 10
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_source record;
  v_result jsonb;
  v_finalized jsonb := '[]'::jsonb;
  v_checked int := 0;
BEGIN
  FOR v_source IN
    SELECT id
    FROM public.bot_website_sources
    WHERE status = 'processing'
    ORDER BY updated_at ASC
  LOOP
    v_checked := v_checked + 1;
    v_result := public.try_finalize_website_source(v_source.id, 300, p_stale_minutes);

    IF v_result IS NOT NULL
      AND v_result ? 'finalized'
      AND (v_result->>'finalized')::boolean THEN
      v_finalized := v_finalized || jsonb_build_array(
        jsonb_build_object(
          'source_id', v_source.id,
          'status', v_result->>'status',
          'failed_pages', v_result->'failed_pages'
        )
      );
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'sources_checked', v_checked,
    'finalized', v_finalized
  );
END;
$$;

REVOKE ALL ON FUNCTION public.sweep_stuck_website_builds(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sweep_stuck_website_builds(int) TO service_role;

-- ---------------------------------------------------------------------------
-- pg_cron: sweep stuck website builds every 5 minutes
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM cron.job
    WHERE jobname = 'sweep-stuck-website-builds'
  ) THEN
    PERFORM cron.unschedule('sweep-stuck-website-builds');
  END IF;
END $$;

SELECT cron.schedule(
  'sweep-stuck-website-builds',
  '*/5 * * * *',
  $$SELECT public.sweep_stuck_website_builds(10);$$
);
