-- Product 2 manual email access + one-time profile fields

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS has_maps_access boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS maps_access_granted_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS full_name text NULL,
  ADD COLUMN IF NOT EXISTS mobile_phone text NULL,
  ADD COLUMN IF NOT EXISTS profile_completed_at timestamptz NULL;

COMMENT ON COLUMN public.customers.has_maps_access IS
  'Manual Product 2 (Location Leads) access. Set via maps_access_emails allowlist or direct update.';

-- Allowlist: owner inserts buyer email here before/after they pay manually.
CREATE TABLE IF NOT EXISTS public.maps_access_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  note text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT maps_access_emails_email_lower_chk
    CHECK (email = lower(email)),
  CONSTRAINT maps_access_emails_email_unique UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_maps_access_emails_email
  ON public.maps_access_emails (email);

ALTER TABLE public.maps_access_emails ENABLE ROW LEVEL SECURITY;

-- No authenticated policies: only service_role manages this table.
REVOKE ALL ON TABLE public.maps_access_emails FROM PUBLIC;
REVOKE ALL ON TABLE public.maps_access_emails FROM anon;
REVOKE ALL ON TABLE public.maps_access_emails FROM authenticated;
GRANT ALL ON TABLE public.maps_access_emails TO service_role;

-- When an allowlisted email already has a customer row, grant access.
CREATE OR REPLACE FUNCTION public.grant_maps_access_from_allowlist()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.email := lower(trim(NEW.email));

  UPDATE public.customers
  SET
    has_maps_access = true,
    maps_access_granted_at = coalesce(maps_access_granted_at, now())
  WHERE lower(email) = NEW.email
    AND has_maps_access = false;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_maps_access_emails_grant ON public.maps_access_emails;
CREATE TRIGGER trg_maps_access_emails_grant
  BEFORE INSERT OR UPDATE OF email ON public.maps_access_emails
  FOR EACH ROW
  EXECUTE FUNCTION public.grant_maps_access_from_allowlist();
