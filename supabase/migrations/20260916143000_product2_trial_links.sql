-- Isolated Product 2 anonymous trial links (does not touch maps_* or customers credits)

-- ---------------------------------------------------------------------------
-- trial_links
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.trial_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL,
  note text NULL,
  status text NOT NULL DEFAULT 'unused',
  search_used boolean NOT NULL DEFAULT false,
  trial_started_at timestamptz NULL,
  expires_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  disabled_at timestamptz NULL,
  CONSTRAINT trial_links_token_nonempty CHECK (char_length(token) >= 16),
  CONSTRAINT trial_links_status_allowed
    CHECK (status IN ('unused', 'active', 'expired', 'disabled'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_trial_links_token
  ON public.trial_links (token);

CREATE INDEX IF NOT EXISTS idx_trial_links_status_expires
  ON public.trial_links (status, expires_at);

-- ---------------------------------------------------------------------------
-- trial_searches
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.trial_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trial_link_id uuid NOT NULL REFERENCES public.trial_links (id) ON DELETE CASCADE,
  keyword text NOT NULL,
  country text NOT NULL,
  state text NULL,
  city text NULL,
  location_name text NOT NULL,
  depth integer NOT NULL DEFAULT 100,
  status text NOT NULL DEFAULT 'queued',
  dataforseo_task_id text NULL,
  error_message text NULL,
  results_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz NULL,
  CONSTRAINT trial_searches_depth_positive CHECK (depth > 0 AND depth <= 700),
  CONSTRAINT trial_searches_status_allowed
    CHECK (status IN ('queued', 'submitted', 'completed', 'failed')),
  CONSTRAINT trial_searches_results_count_nonnegative CHECK (results_count >= 0)
);

CREATE INDEX IF NOT EXISTS idx_trial_searches_link_created
  ON public.trial_searches (trial_link_id, created_at DESC);

-- At most one in-flight or successful search per link (failed rows may retry)
CREATE UNIQUE INDEX IF NOT EXISTS idx_trial_searches_one_active_per_link
  ON public.trial_searches (trial_link_id)
  WHERE status IN ('queued', 'submitted', 'completed');

CREATE OR REPLACE FUNCTION public.set_trial_searches_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_trial_searches_updated_at ON public.trial_searches;

CREATE TRIGGER trg_trial_searches_updated_at
  BEFORE UPDATE ON public.trial_searches
  FOR EACH ROW
  EXECUTE FUNCTION public.set_trial_searches_updated_at();

-- ---------------------------------------------------------------------------
-- trial_leads (store only what trial needs; API still returns title/category/phone only)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.trial_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trial_link_id uuid NOT NULL REFERENCES public.trial_links (id) ON DELETE CASCADE,
  trial_search_id uuid NOT NULL REFERENCES public.trial_searches (id) ON DELETE CASCADE,
  place_id text NULL,
  title text NULL,
  category text NULL,
  phone text NOT NULL,
  rank_absolute integer NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT trial_leads_phone_nonempty CHECK (char_length(trim(phone)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_trial_leads_link_id
  ON public.trial_leads (trial_link_id);

CREATE INDEX IF NOT EXISTS idx_trial_leads_search_rank
  ON public.trial_leads (trial_search_id, rank_absolute);

CREATE UNIQUE INDEX IF NOT EXISTS idx_trial_leads_search_place_id
  ON public.trial_leads (trial_search_id, place_id)
  WHERE place_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- RLS: no anon/authenticated access — service_role only
-- ---------------------------------------------------------------------------

ALTER TABLE public.trial_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trial_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trial_leads ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.trial_links FROM PUBLIC;
REVOKE ALL ON public.trial_links FROM anon;
REVOKE ALL ON public.trial_links FROM authenticated;
REVOKE ALL ON public.trial_searches FROM PUBLIC;
REVOKE ALL ON public.trial_searches FROM anon;
REVOKE ALL ON public.trial_searches FROM authenticated;
REVOKE ALL ON public.trial_leads FROM PUBLIC;
REVOKE ALL ON public.trial_leads FROM anon;
REVOKE ALL ON public.trial_leads FROM authenticated;

GRANT ALL ON public.trial_links TO service_role;
GRANT ALL ON public.trial_searches TO service_role;
GRANT ALL ON public.trial_leads TO service_role;

-- ---------------------------------------------------------------------------
-- Cleanup after 2-hour window (does not touch maps_*)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.cleanup_expired_trial_links()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.trial_links
  SET status = 'expired'
  WHERE status IN ('unused', 'active')
    AND expires_at IS NOT NULL
    AND expires_at < now();

  DELETE FROM public.trial_leads
  WHERE trial_link_id IN (
    SELECT id FROM public.trial_links WHERE status = 'expired'
  );

  DELETE FROM public.trial_searches
  WHERE trial_link_id IN (
    SELECT id FROM public.trial_links WHERE status = 'expired'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_expired_trial_links() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cleanup_expired_trial_links() FROM anon;
REVOKE ALL ON FUNCTION public.cleanup_expired_trial_links() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_trial_links() TO service_role;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM cron.job
    WHERE jobname = 'cleanup-trial-links-15m'
  ) THEN
    PERFORM cron.unschedule('cleanup-trial-links-15m');
  END IF;
END $$;

SELECT cron.schedule(
  'cleanup-trial-links-15m',
  '*/15 * * * *',
  $$SELECT public.cleanup_expired_trial_links();$$
);
