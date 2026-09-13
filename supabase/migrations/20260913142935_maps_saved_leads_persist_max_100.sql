-- Keep saved maps leads after search expiry (max 100 per customer, manual delete).

-- Allow detaching saved leads from expired searches.
ALTER TABLE public.maps_leads
  ALTER COLUMN search_id DROP NOT NULL;

ALTER TABLE public.maps_leads
  DROP CONSTRAINT IF EXISTS maps_leads_search_id_fkey;

ALTER TABLE public.maps_leads
  ADD CONSTRAINT maps_leads_search_id_fkey
  FOREIGN KEY (search_id)
  REFERENCES public.maps_searches (id)
  ON DELETE SET NULL;

-- Track when a lead was saved.
ALTER TABLE public.maps_leads
  ADD COLUMN IF NOT EXISTS saved_at timestamptz NULL;

CREATE INDEX IF NOT EXISTS idx_maps_leads_customer_saved_at
  ON public.maps_leads (customer_id, saved_at DESC)
  WHERE is_saved = true;

-- Cleanup: detach saved leads, then delete expired searches (unsaved leads go with search via SET NULL only if we null search first for saved; unsaved still need deletion).

CREATE OR REPLACE FUNCTION public.cleanup_expired_maps_searches()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Preserve saved leads: unlink them before deleting old searches.
  UPDATE public.maps_leads AS leads
  SET search_id = NULL
  FROM public.maps_searches AS searches
  WHERE leads.search_id = searches.id
    AND leads.is_saved = true
    AND searches.created_at < now() - interval '24 hours';

  -- Remove unsaved leads tied to expired searches (explicit, before search delete).
  DELETE FROM public.maps_leads AS leads
  USING public.maps_searches AS searches
  WHERE leads.search_id = searches.id
    AND leads.is_saved = false
    AND searches.created_at < now() - interval '24 hours';

  -- Delete expired searches. Remaining linked leads (if any) get search_id nulled by FK.
  DELETE FROM public.maps_searches
  WHERE created_at < now() - interval '24 hours';

  -- Safety: drop orphan unsaved leads with no search.
  DELETE FROM public.maps_leads
  WHERE is_saved = false
    AND search_id IS NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_expired_maps_searches() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cleanup_expired_maps_searches() FROM anon;
REVOKE ALL ON FUNCTION public.cleanup_expired_maps_searches() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_maps_searches() TO service_role;

-- Allow users to permanently delete their own leads (saved list).
DROP POLICY IF EXISTS maps_leads_delete_own ON public.maps_leads;
CREATE POLICY maps_leads_delete_own ON public.maps_leads
  FOR DELETE TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM public.customers WHERE user_id = auth.uid()
    )
  );

GRANT SELECT, UPDATE, DELETE ON public.maps_leads TO authenticated;
