-- Website RAG knowledge: sources, pages, chunks, pgvector, RPCs

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE public.bot_website_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id text NOT NULL UNIQUE REFERENCES public.bots(bot_id) ON DELETE CASCADE,
  website_url text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'idle'
    CHECK (status IN ('idle', 'discovering', 'processing', 'ready', 'partial', 'failed')),
  total_pages int NOT NULL DEFAULT 0,
  completed_pages int NOT NULL DEFAULT 0,
  failed_pages int NOT NULL DEFAULT 0,
  current_page_index int NOT NULL DEFAULT 0,
  selected_urls jsonb,
  error_message text,
  refresh_error_message text,
  embedding_model text,
  embedding_dimensions int,
  last_processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_bot_website_sources_bot_id ON public.bot_website_sources (bot_id);
CREATE INDEX idx_bot_website_sources_status ON public.bot_website_sources (status);

CREATE TABLE public.bot_website_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES public.bot_website_sources(id) ON DELETE CASCADE,
  bot_id text NOT NULL REFERENCES public.bots(bot_id) ON DELETE CASCADE,
  page_url text NOT NULL,
  normalized_url text NOT NULL,
  page_title text NOT NULL DEFAULT '',
  sort_order int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  processing_started_at timestamptz,
  reclaim_count int NOT NULL DEFAULT 0,
  content_hash text,
  error_message text,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_id, normalized_url)
);

CREATE INDEX idx_bot_website_pages_source_id ON public.bot_website_pages (source_id);
CREATE INDEX idx_bot_website_pages_bot_id ON public.bot_website_pages (bot_id);
CREATE INDEX idx_bot_website_pages_status ON public.bot_website_pages (source_id, status);

CREATE TABLE public.bot_website_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES public.bot_website_sources(id) ON DELETE CASCADE,
  page_id uuid NOT NULL REFERENCES public.bot_website_pages(id) ON DELETE CASCADE,
  bot_id text NOT NULL REFERENCES public.bots(bot_id) ON DELETE CASCADE,
  source_url text NOT NULL,
  page_title text NOT NULL DEFAULT '',
  heading text NOT NULL DEFAULT '',
  chunk_content text NOT NULL,
  embedding extensions.vector(1536),
  chunk_order int NOT NULL DEFAULT 0,
  content_hash text,
  scraped_at timestamptz NOT NULL DEFAULT now(),
  embedding_model text,
  embedding_dimensions int,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_bot_website_chunks_bot_id ON public.bot_website_chunks (bot_id);
CREATE INDEX idx_bot_website_chunks_page_id ON public.bot_website_chunks (page_id);
CREATE INDEX idx_bot_website_chunks_source_id ON public.bot_website_chunks (source_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.bot_website_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_website_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_website_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY bot_website_sources_select_own ON public.bot_website_sources
  FOR SELECT TO authenticated
  USING (
    bot_id IN (
      SELECT b.bot_id
      FROM public.bots b
      JOIN public.customers c ON c.id = b.customer_id
      WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY bot_website_sources_insert_own ON public.bot_website_sources
  FOR INSERT TO authenticated
  WITH CHECK (
    bot_id IN (
      SELECT b.bot_id
      FROM public.bots b
      JOIN public.customers c ON c.id = b.customer_id
      WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY bot_website_sources_update_own ON public.bot_website_sources
  FOR UPDATE TO authenticated
  USING (
    bot_id IN (
      SELECT b.bot_id
      FROM public.bots b
      JOIN public.customers c ON c.id = b.customer_id
      WHERE c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    bot_id IN (
      SELECT b.bot_id
      FROM public.bots b
      JOIN public.customers c ON c.id = b.customer_id
      WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY bot_website_pages_select_own ON public.bot_website_pages
  FOR SELECT TO authenticated
  USING (
    bot_id IN (
      SELECT b.bot_id
      FROM public.bots b
      JOIN public.customers c ON c.id = b.customer_id
      WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY bot_website_chunks_select_own ON public.bot_website_chunks
  FOR SELECT TO authenticated
  USING (
    bot_id IN (
      SELECT b.bot_id
      FROM public.bots b
      JOIN public.customers c ON c.id = b.customer_id
      WHERE c.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- RPC: claim_next_website_page
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.claim_next_website_page(p_source_id uuid)
RETURNS TABLE (
  id uuid,
  page_url text,
  normalized_url text,
  page_title text,
  sort_order int,
  bot_id text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.bot_website_pages p
  SET
    status = 'processing',
    processing_started_at = now(),
    updated_at = now()
  WHERE p.id = (
    SELECT p2.id
    FROM public.bot_website_pages p2
    WHERE p2.source_id = p_source_id
      AND p2.status = 'pending'
    ORDER BY p2.sort_order ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING p.id, p.page_url, p.normalized_url, p.page_title, p.sort_order, p.bot_id;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_next_website_page(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_next_website_page(uuid) TO service_role;

-- ---------------------------------------------------------------------------
-- RPC: reclaim_stale_processing_pages
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.reclaim_stale_processing_pages(
  p_source_id uuid,
  p_stale_minutes int DEFAULT 15
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reset int := 0;
  v_failed int := 0;
BEGIN
  UPDATE public.bot_website_pages
  SET
    status = 'pending',
    processing_started_at = NULL,
    reclaim_count = reclaim_count + 1,
    updated_at = now()
  WHERE source_id = p_source_id
    AND status = 'processing'
    AND processing_started_at IS NOT NULL
    AND processing_started_at < now() - (p_stale_minutes || ' minutes')::interval
    AND reclaim_count < 1;

  GET DIAGNOSTICS v_reset = ROW_COUNT;

  UPDATE public.bot_website_pages
  SET
    status = 'failed',
    error_message = 'Processing timed out after multiple attempts.',
    processing_started_at = NULL,
    updated_at = now()
  WHERE source_id = p_source_id
    AND status = 'processing'
    AND processing_started_at IS NOT NULL
    AND processing_started_at < now() - (p_stale_minutes || ' minutes')::interval
    AND reclaim_count >= 1;

  GET DIAGNOSTICS v_failed = ROW_COUNT;

  RETURN jsonb_build_object('reset', v_reset, 'failed', v_failed);
END;
$$;

REVOKE ALL ON FUNCTION public.reclaim_stale_processing_pages(uuid, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reclaim_stale_processing_pages(uuid, int) TO service_role;

-- ---------------------------------------------------------------------------
-- RPC: replace_page_chunks
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.replace_page_chunks(
  p_page_id uuid,
  p_chunks jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_chunk jsonb;
  v_source_id uuid;
  v_bot_id text;
  v_inserted int := 0;
BEGIN
  SELECT source_id, bot_id
  INTO v_source_id, v_bot_id
  FROM public.bot_website_pages
  WHERE id = p_page_id;

  IF v_source_id IS NULL THEN
    RAISE EXCEPTION 'Page not found: %', p_page_id;
  END IF;

  DELETE FROM public.bot_website_chunks WHERE page_id = p_page_id;

  FOR v_chunk IN SELECT * FROM jsonb_array_elements(p_chunks)
  LOOP
    INSERT INTO public.bot_website_chunks (
      source_id,
      page_id,
      bot_id,
      source_url,
      page_title,
      heading,
      chunk_content,
      embedding,
      chunk_order,
      content_hash,
      scraped_at,
      embedding_model,
      embedding_dimensions
    ) VALUES (
      v_source_id,
      p_page_id,
      v_bot_id,
      COALESCE(v_chunk->>'source_url', ''),
      COALESCE(v_chunk->>'page_title', ''),
      COALESCE(v_chunk->>'heading', ''),
      COALESCE(v_chunk->>'chunk_content', ''),
      (v_chunk->>'embedding')::extensions.vector(1536),
      COALESCE((v_chunk->>'chunk_order')::int, 0),
      v_chunk->>'content_hash',
      COALESCE((v_chunk->>'scraped_at')::timestamptz, now()),
      v_chunk->>'embedding_model',
      (v_chunk->>'embedding_dimensions')::int
    );
    v_inserted := v_inserted + 1;
  END LOOP;

  RETURN jsonb_build_object('inserted', v_inserted);
END;
$$;

REVOKE ALL ON FUNCTION public.replace_page_chunks(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.replace_page_chunks(uuid, jsonb) TO service_role;

-- ---------------------------------------------------------------------------
-- RPC: cleanup_stale_website_pages
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.cleanup_stale_website_pages(
  p_source_id uuid,
  p_selected_normalized_urls text[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_pages int := 0;
BEGIN
  DELETE FROM public.bot_website_chunks
  WHERE page_id IN (
    SELECT id FROM public.bot_website_pages
    WHERE source_id = p_source_id
      AND normalized_url <> ALL (COALESCE(p_selected_normalized_urls, ARRAY[]::text[]))
  );

  DELETE FROM public.bot_website_pages
  WHERE source_id = p_source_id
    AND normalized_url <> ALL (COALESCE(p_selected_normalized_urls, ARRAY[]::text[]));

  GET DIAGNOSTICS v_deleted_pages = ROW_COUNT;

  RETURN jsonb_build_object('deleted_pages', v_deleted_pages);
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_stale_website_pages(uuid, text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_stale_website_pages(uuid, text[]) TO service_role;

-- ---------------------------------------------------------------------------
-- RPC: match_website_chunks
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.match_website_chunks(
  p_bot_id text,
  p_query_embedding extensions.vector(1536),
  p_match_threshold float DEFAULT 0.7,
  p_match_count int DEFAULT 3
)
RETURNS TABLE (
  chunk_content text,
  source_url text,
  page_title text,
  heading text,
  similarity float
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT
    c.chunk_content,
    c.source_url,
    c.page_title,
    c.heading,
    (1 - (c.embedding <=> p_query_embedding))::float AS similarity
  FROM public.bot_website_chunks c
  WHERE c.bot_id = p_bot_id
    AND c.embedding IS NOT NULL
    AND c.chunk_content <> ''
    AND (1 - (c.embedding <=> p_query_embedding)) >= p_match_threshold
  ORDER BY c.embedding <=> p_query_embedding
  LIMIT GREATEST(p_match_count, 0);
$$;

REVOKE ALL ON FUNCTION public.match_website_chunks(text, extensions.vector, float, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.match_website_chunks(text, extensions.vector, float, int) TO service_role;

-- ---------------------------------------------------------------------------
-- RPC: count_valid_website_chunks
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.count_valid_website_chunks(p_bot_id text)
RETURNS int
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int
  FROM public.bot_website_chunks
  WHERE bot_id = p_bot_id
    AND chunk_content IS NOT NULL
    AND btrim(chunk_content) <> '';
$$;

REVOKE ALL ON FUNCTION public.count_valid_website_chunks(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_valid_website_chunks(text) TO service_role;
