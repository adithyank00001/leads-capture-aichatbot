-- Product 1 manual email access allowlist (mirrors maps_access_emails for Product 2).

CREATE TABLE IF NOT EXISTS public.lifetime_access_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  note text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lifetime_access_emails_email_lower_chk
    CHECK (email = lower(email)),
  CONSTRAINT lifetime_access_emails_email_unique UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_lifetime_access_emails_email
  ON public.lifetime_access_emails (email);

ALTER TABLE public.lifetime_access_emails ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.lifetime_access_emails FROM PUBLIC;
REVOKE ALL ON TABLE public.lifetime_access_emails FROM anon;
REVOKE ALL ON TABLE public.lifetime_access_emails FROM authenticated;
GRANT ALL ON TABLE public.lifetime_access_emails TO service_role;

COMMENT ON TABLE public.lifetime_access_emails IS
  'Manual Product 1 (chatbot lifetime) access. Founder inserts buyer email; claim on login.';

-- When an allowlisted email already has a customer row, grant access.
CREATE OR REPLACE FUNCTION public.grant_lifetime_access_from_allowlist()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.email := lower(trim(NEW.email));

  UPDATE public.customers
  SET
    has_lifetime_access = true,
    lifetime_access_granted_at = coalesce(lifetime_access_granted_at, now())
  WHERE lower(email) = NEW.email
    AND has_lifetime_access = false;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lifetime_access_emails_grant ON public.lifetime_access_emails;
CREATE TRIGGER trg_lifetime_access_emails_grant
  BEFORE INSERT OR UPDATE OF email ON public.lifetime_access_emails
  FOR EACH ROW
  EXECUTE FUNCTION public.grant_lifetime_access_from_allowlist();
