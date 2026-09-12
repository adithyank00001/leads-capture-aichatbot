-- Product 2: location B2B lead generation (isolated from chatbot product)

-- ---------------------------------------------------------------------------
-- Customer lifetime lead credits (Product 2 only)
-- ---------------------------------------------------------------------------

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS maps_lead_credits_limit integer NOT NULL DEFAULT 100000,
  ADD COLUMN IF NOT EXISTS maps_lead_credits_used integer NOT NULL DEFAULT 0;

ALTER TABLE public.customers
  DROP CONSTRAINT IF EXISTS customers_maps_lead_credits_used_nonnegative;

ALTER TABLE public.customers
  ADD CONSTRAINT customers_maps_lead_credits_used_nonnegative
  CHECK (maps_lead_credits_used >= 0);

ALTER TABLE public.customers
  DROP CONSTRAINT IF EXISTS customers_maps_lead_credits_within_limit;

ALTER TABLE public.customers
  ADD CONSTRAINT customers_maps_lead_credits_within_limit
  CHECK (maps_lead_credits_used <= maps_lead_credits_limit);

-- ---------------------------------------------------------------------------
-- maps_searches
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.maps_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers (id) ON DELETE CASCADE,
  keyword text NOT NULL,
  country text NOT NULL,
  state text NULL,
  city text NULL,
  location_name text NOT NULL,
  depth integer NOT NULL,
  credits_charged integer NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  dataforseo_task_id text NULL,
  error_message text NULL,
  results_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz NULL,
  CONSTRAINT maps_searches_depth_allowed
    CHECK (depth IN (50, 100, 200, 500, 700)),
  CONSTRAINT maps_searches_status_allowed
    CHECK (status IN ('queued', 'submitted', 'completed', 'failed')),
  CONSTRAINT maps_searches_credits_charged_positive
    CHECK (credits_charged > 0),
  CONSTRAINT maps_searches_results_count_nonnegative
    CHECK (results_count >= 0)
);

CREATE INDEX IF NOT EXISTS idx_maps_searches_customer_created
  ON public.maps_searches (customer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_maps_searches_status_created
  ON public.maps_searches (status, created_at);

-- ---------------------------------------------------------------------------
-- maps_leads
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.maps_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  search_id uuid NOT NULL REFERENCES public.maps_searches (id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers (id) ON DELETE CASCADE,
  place_id text NULL,
  title text NULL,
  category text NULL,
  phone text NULL,
  address text NULL,
  website text NULL,
  rating_value numeric NULL,
  rating_votes integer NULL,
  latitude double precision NULL,
  longitude double precision NULL,
  cid text NULL,
  is_claimed boolean NULL,
  snippet text NULL,
  additional_categories jsonb NULL,
  raw_item jsonb NULL,
  is_saved boolean NOT NULL DEFAULT false,
  rank_absolute integer NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_maps_leads_search_place_id
  ON public.maps_leads (search_id, place_id)
  WHERE place_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_maps_leads_customer_saved
  ON public.maps_leads (customer_id, is_saved)
  WHERE is_saved = true;

CREATE INDEX IF NOT EXISTS idx_maps_leads_search_id
  ON public.maps_leads (search_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_maps_searches_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_maps_searches_updated_at ON public.maps_searches;

CREATE TRIGGER trg_maps_searches_updated_at
  BEFORE UPDATE ON public.maps_searches
  FOR EACH ROW
  EXECUTE FUNCTION public.set_maps_searches_updated_at();

-- ---------------------------------------------------------------------------
-- Atomic credit RPCs
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.maps_deduct_credits(
  p_customer_id uuid,
  p_amount integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_rows integer;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid credit amount';
  END IF;

  UPDATE public.customers
  SET maps_lead_credits_used = maps_lead_credits_used + p_amount
  WHERE id = p_customer_id
    AND maps_lead_credits_used + p_amount <= maps_lead_credits_limit;

  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  RETURN updated_rows = 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.maps_refund_credits(
  p_customer_id uuid,
  p_amount integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_rows integer;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid credit amount';
  END IF;

  UPDATE public.customers
  SET maps_lead_credits_used = GREATEST(maps_lead_credits_used - p_amount, 0)
  WHERE id = p_customer_id;

  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  RETURN updated_rows = 1;
END;
$$;

REVOKE ALL ON FUNCTION public.maps_deduct_credits(uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.maps_refund_credits(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.maps_deduct_credits(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.maps_refund_credits(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.maps_deduct_credits(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.maps_refund_credits(uuid, integer) TO authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.maps_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maps_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS maps_searches_select_own ON public.maps_searches;
CREATE POLICY maps_searches_select_own ON public.maps_searches
  FOR SELECT TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM public.customers WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS maps_searches_insert_own ON public.maps_searches;
CREATE POLICY maps_searches_insert_own ON public.maps_searches
  FOR INSERT TO authenticated
  WITH CHECK (
    customer_id IN (
      SELECT id FROM public.customers WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS maps_searches_update_own ON public.maps_searches;
CREATE POLICY maps_searches_update_own ON public.maps_searches
  FOR UPDATE TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM public.customers WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    customer_id IN (
      SELECT id FROM public.customers WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS maps_leads_select_own ON public.maps_leads;
CREATE POLICY maps_leads_select_own ON public.maps_leads
  FOR SELECT TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM public.customers WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS maps_leads_update_own ON public.maps_leads;
CREATE POLICY maps_leads_update_own ON public.maps_leads
  FOR UPDATE TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM public.customers WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    customer_id IN (
      SELECT id FROM public.customers WHERE user_id = auth.uid()
    )
  );

-- Authenticated clients do not insert leads (webhook/service role only).
-- Service role bypasses RLS.

GRANT SELECT, INSERT, UPDATE ON public.maps_searches TO authenticated;
GRANT SELECT, UPDATE ON public.maps_leads TO authenticated;
GRANT ALL ON public.maps_searches TO service_role;
GRANT ALL ON public.maps_leads TO service_role;

-- ---------------------------------------------------------------------------
-- 24-hour cleanup cron
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.cleanup_expired_maps_searches()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.maps_searches
  WHERE created_at < now() - interval '24 hours';
$$;

REVOKE ALL ON FUNCTION public.cleanup_expired_maps_searches() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_maps_searches() TO service_role;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM cron.job
    WHERE jobname = 'cleanup-maps-searches-hourly'
  ) THEN
    PERFORM cron.unschedule('cleanup-maps-searches-hourly');
  END IF;
END $$;

SELECT cron.schedule(
  'cleanup-maps-searches-hourly',
  '0 * * * *',
  $$SELECT public.cleanup_expired_maps_searches();$$
);
