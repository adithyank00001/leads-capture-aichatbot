-- Harden trial updated_at trigger search_path (service_role-only tables unchanged)

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
