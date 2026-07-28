-- Parallel page workers: atomic begin/complete/finalize/retry RPCs

-- ---------------------------------------------------------------------------
-- RPC: begin_website_page_processing
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.begin_website_page_processing(p_page_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_page public.bot_website_pages%ROWTYPE;
BEGIN
  UPDATE public.bot_website_pages p
  SET
    status = 'processing',
    processing_started_at = now(),
    updated_at = now()
  FROM public.bot_website_sources s
  WHERE p.id = p_page_id
    AND p.source_id = s.id
    AND p.status = 'pending'
    AND s.status IN ('processing', 'partial')
  RETURNING p.*
  INTO v_page;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('started', false);
  END IF;

  RETURN jsonb_build_object(
    'started', true,
    'page', jsonb_build_object(
      'id', v_page.id,
      'source_id', v_page.source_id,
      'bot_id', v_page.bot_id,
      'page_url', v_page.page_url,
      'normalized_url', v_page.normalized_url,
      'page_title', v_page.page_title,
      'sort_order', v_page.sort_order,
      'status', v_page.status
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.begin_website_page_processing(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.begin_website_page_processing(uuid) TO service_role;

-- ---------------------------------------------------------------------------
-- RPC: complete_website_page
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.complete_website_page(
  p_page_id uuid,
  p_success boolean,
  p_patch jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_page public.bot_website_pages%ROWTYPE;
  v_source public.bot_website_sources%ROWTYPE;
  v_new_status text;
BEGIN
  v_new_status := CASE WHEN p_success THEN 'completed' ELSE 'failed' END;

  UPDATE public.bot_website_pages
  SET
    status = v_new_status,
    page_title = COALESCE(p_patch->>'page_title', page_title),
    content_hash = COALESCE(p_patch->>'content_hash', content_hash),
    error_message = CASE
      WHEN p_success THEN NULL
      ELSE COALESCE(p_patch->>'error_message', error_message)
    END,
    processing_started_at = NULL,
    processed_at = COALESCE((p_patch->>'processed_at')::timestamptz, now()),
    updated_at = now()
  WHERE id = p_page_id
    AND status = 'processing'
  RETURNING *
  INTO v_page;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('completed', false, 'reason', 'not_processing');
  END IF;

  UPDATE public.bot_website_sources
  SET
    completed_pages = completed_pages + CASE WHEN p_success THEN 1 ELSE 0 END,
    failed_pages = failed_pages + CASE WHEN p_success THEN 0 ELSE 1 END,
    updated_at = now()
  WHERE id = v_page.source_id
  RETURNING *
  INTO v_source;

  RETURN jsonb_build_object(
    'completed', true,
    'page_status', v_new_status,
    'source_id', v_source.id,
    'completed_pages', v_source.completed_pages,
    'failed_pages', v_source.failed_pages
  );
END;
$$;

REVOKE ALL ON FUNCTION public.complete_website_page(uuid, boolean, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_website_page(uuid, boolean, jsonb) TO service_role;

-- ---------------------------------------------------------------------------
-- RPC: retry_website_page
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.retry_website_page(p_page_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_page public.bot_website_pages%ROWTYPE;
  v_source public.bot_website_sources%ROWTYPE;
BEGIN
  SELECT *
  INTO v_page
  FROM public.bot_website_pages
  WHERE id = p_page_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Page not found: %', p_page_id;
  END IF;

  IF v_page.status <> 'failed' THEN
    RETURN jsonb_build_object('retried', false, 'reason', 'not_failed');
  END IF;

  SELECT *
  INTO v_source
  FROM public.bot_website_sources
  WHERE id = v_page.source_id
  FOR UPDATE;

  UPDATE public.bot_website_pages
  SET
    status = 'pending',
    error_message = NULL,
    processing_started_at = NULL,
    processed_at = NULL,
    updated_at = now()
  WHERE id = p_page_id
  RETURNING *
  INTO v_page;

  UPDATE public.bot_website_sources
  SET
    failed_pages = GREATEST(failed_pages - 1, 0),
    status = CASE
      WHEN status IN ('partial', 'ready') THEN 'processing'
      ELSE status
    END,
    updated_at = now()
  WHERE id = v_source.id
  RETURNING *
  INTO v_source;

  RETURN jsonb_build_object(
    'retried', true,
    'page', jsonb_build_object(
      'id', v_page.id,
      'status', v_page.status,
      'page_url', v_page.page_url
    ),
    'source', jsonb_build_object(
      'id', v_source.id,
      'status', v_source.status,
      'failed_pages', v_source.failed_pages
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.retry_website_page(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.retry_website_page(uuid) TO service_role;

-- ---------------------------------------------------------------------------
-- RPC: try_finalize_website_source
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.try_finalize_website_source(
  p_source_id uuid,
  p_min_chars int DEFAULT 300,
  p_stale_minutes int DEFAULT 8
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
  v_reclaim jsonb;
BEGIN
  PERFORM public.reclaim_stale_processing_pages(p_source_id, p_stale_minutes);

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
