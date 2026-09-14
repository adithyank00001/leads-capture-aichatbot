-- Fix: protect_customer_entitlements was freezing maps_lead_credits_used
-- even when maps_deduct_credits / maps_refund_credits ran, so searches
-- succeeded but used credits never changed.
--
-- Allow credit used changes ONLY when the official credit RPCs set a
-- transaction-local flag. Keep locking access/billing/limit fields.

CREATE OR REPLACE FUNCTION public.protect_customer_entitlements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mobile_digits text;
  allow_maps_credits boolean;
BEGIN
  -- Admin / SQL / service_role may change anything.
  IF auth.uid() IS NULL OR coalesce(auth.role(), '') = 'service_role' THEN
    RETURN NEW;
  END IF;

  allow_maps_credits :=
    coalesce(current_setting('app.allow_maps_credits_update', true), '') = '1';

  -- Authenticated users cannot self-grant product access or billing fields.
  NEW.has_lifetime_access := OLD.has_lifetime_access;
  NEW.lifetime_access_granted_at := OLD.lifetime_access_granted_at;
  NEW.has_maps_access := OLD.has_maps_access;
  NEW.maps_access_granted_at := OLD.maps_access_granted_at;
  NEW.dodo_payment_id := OLD.dodo_payment_id;
  NEW.dodo_customer_id := OLD.dodo_customer_id;
  NEW.maps_lead_credits_limit := OLD.maps_lead_credits_limit;
  NEW.email := OLD.email;
  NEW.user_id := OLD.user_id;

  -- Credit usage may change only via maps_deduct_credits / maps_refund_credits.
  IF NOT allow_maps_credits THEN
    NEW.maps_lead_credits_used := OLD.maps_lead_credits_used;
  END IF;

  -- One-time profile: once completed, lock name / mobile / completed timestamp.
  IF OLD.profile_completed_at IS NOT NULL THEN
    NEW.full_name := OLD.full_name;
    NEW.mobile_phone := OLD.mobile_phone;
    NEW.profile_completed_at := OLD.profile_completed_at;
  ELSE
    IF NEW.profile_completed_at IS NOT NULL THEN
      mobile_digits := regexp_replace(coalesce(NEW.mobile_phone, ''), '\D', '', 'g');
      IF NEW.full_name IS NULL
         OR length(btrim(NEW.full_name)) < 2
         OR length(mobile_digits) < 8 THEN
        RAISE EXCEPTION 'Profile requires a valid full name and mobile number'
          USING ERRCODE = 'check_violation';
      END IF;
      NEW.full_name := btrim(NEW.full_name);
      NEW.mobile_phone := btrim(NEW.mobile_phone);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

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
  caller_role text := coalesce(auth.role(), '');
  old_used integer;
  new_used integer;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid credit amount';
  END IF;

  IF caller_role <> 'service_role' THEN
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM public.customers
      WHERE id = p_customer_id
        AND user_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'Forbidden customer';
    END IF;
  END IF;

  SELECT maps_lead_credits_used
  INTO old_used
  FROM public.customers
  WHERE id = p_customer_id
  FOR UPDATE;

  IF old_used IS NULL THEN
    RETURN false;
  END IF;

  -- Allow protect_customer_entitlements to keep the credit change.
  PERFORM set_config('app.allow_maps_credits_update', '1', true);

  UPDATE public.customers
  SET maps_lead_credits_used = maps_lead_credits_used + p_amount
  WHERE id = p_customer_id
    AND maps_lead_credits_used + p_amount <= maps_lead_credits_limit;

  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  IF updated_rows <> 1 THEN
    RETURN false;
  END IF;

  SELECT maps_lead_credits_used
  INTO new_used
  FROM public.customers
  WHERE id = p_customer_id;

  RETURN new_used = old_used + p_amount;
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
  caller_role text := coalesce(auth.role(), '');
  old_used integer;
  new_used integer;
  expected_used integer;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid credit amount';
  END IF;

  IF caller_role <> 'service_role' THEN
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM public.customers
      WHERE id = p_customer_id
        AND user_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'Forbidden customer';
    END IF;
  END IF;

  SELECT maps_lead_credits_used
  INTO old_used
  FROM public.customers
  WHERE id = p_customer_id
  FOR UPDATE;

  IF old_used IS NULL THEN
    RETURN false;
  END IF;

  expected_used := GREATEST(old_used - p_amount, 0);

  PERFORM set_config('app.allow_maps_credits_update', '1', true);

  UPDATE public.customers
  SET maps_lead_credits_used = GREATEST(maps_lead_credits_used - p_amount, 0)
  WHERE id = p_customer_id;

  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  IF updated_rows <> 1 THEN
    RETURN false;
  END IF;

  SELECT maps_lead_credits_used
  INTO new_used
  FROM public.customers
  WHERE id = p_customer_id;

  RETURN new_used = expected_used;
END;
$$;

-- Backfill used credits from active/completed searches (not failed,
-- because failed searches are usually refunded).
UPDATE public.customers AS c
SET maps_lead_credits_used = least(
  c.maps_lead_credits_limit,
  coalesce(s.charged, 0)
)
FROM (
  SELECT
    customer_id,
    sum(credits_charged)::integer AS charged
  FROM public.maps_searches
  WHERE status IN ('completed', 'queued', 'submitted')
  GROUP BY customer_id
) AS s
WHERE c.id = s.customer_id
  AND c.maps_lead_credits_used IS DISTINCT FROM least(
    c.maps_lead_credits_limit,
    coalesce(s.charged, 0)
  );
