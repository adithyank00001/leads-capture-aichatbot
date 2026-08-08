-- Lifetime access (LTD) payment fields on customers

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS has_lifetime_access boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS lifetime_access_granted_at timestamptz,
  ADD COLUMN IF NOT EXISTS dodo_payment_id text,
  ADD COLUMN IF NOT EXISTS dodo_customer_id text;

CREATE UNIQUE INDEX IF NOT EXISTS customers_dodo_payment_id_key
  ON public.customers (dodo_payment_id)
  WHERE dodo_payment_id IS NOT NULL;

-- Grandfather all existing customer accounts (free forever)
UPDATE public.customers
SET has_lifetime_access = true,
    lifetime_access_granted_at = COALESCE(lifetime_access_granted_at, created_at, now())
WHERE has_lifetime_access = false;
