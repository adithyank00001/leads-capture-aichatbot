-- Pending lifetime purchases for guest checkout (payment before account)

CREATE TABLE public.pending_lifetime_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  dodo_payment_id text NOT NULL UNIQUE,
  dodo_customer_id text,
  paid_at timestamptz NOT NULL DEFAULT now(),
  claimed_at timestamptz,
  claimed_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX pending_lifetime_purchases_email_unclaimed_idx
  ON public.pending_lifetime_purchases (lower(trim(email)))
  WHERE claimed_at IS NULL;

ALTER TABLE public.pending_lifetime_purchases ENABLE ROW LEVEL SECURITY;
