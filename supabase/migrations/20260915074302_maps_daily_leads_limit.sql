-- Daily lead search limit: 1000 leads per India (IST) calendar day.
-- Enforced inside maps_deduct_credits with a row lock so clients cannot bypass.
-- Credit RPCs are service_role-only (app uses admin client after auth checks).

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS maps_daily_leads_used integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS maps_daily_leads_on date;

ALTER TABLE public.customers
  DROP CONSTRAINT IF EXISTS customers_maps_daily_leads_used_nonneg;

ALTER TABLE public.customers
  ADD CONSTRAINT customers_maps_daily_leads_used_nonneg
  CHECK (maps_daily_leads_used >= 0);

COMMENT ON COLUMN public.customers.maps_daily_leads_used IS
  'Leads charged today (IST). Resets when maps_daily_leads_on rolls to a new IST date.';
COMMENT ON COLUMN public.customers.maps_daily_leads_on IS
  'IST calendar date for maps_daily_leads_used.';

-- Lock daily counters the same way as lifetime used credits.
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
  IF auth.uid() IS NULL OR coalesce(auth.role(), '') = 'service_role' THEN
    RETURN NEW;
  END IF;

  allow_maps_credits :=
    coalesce(current_setting('app.allow_maps_credits_update', true), '') = '1';

  NEW.has_lifetime_access := OLD.has_lifetime_access;
  NEW.lifetime_access_granted_at := OLD.lifetime_access_granted_at;
  NEW.has_maps_access := OLD.has_maps_access;
  NEW.maps_access_granted_at := OLD.maps_access_granted_at;
  NEW.dodo_payment_id := OLD.dodo_payment_id;
  NEW.dodo_customer_id := OLD.dodo_customer_id;
  NEW.maps_lead_credits_limit := OLD.maps_lead_credits_limit;
  NEW.email := OLD.email;
  NEW.user_id := OLD.user_id;

  IF NOT allow_maps_credits THEN
    NEW.maps_lead_credits_used := OLD.maps_lead_credits_used;
    NEW.maps_daily_leads_used := OLD.maps_daily_leads_used;
    NEW.maps_daily_leads_on := OLD.maps_daily_leads_on;
  END IF;

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

-- Return text so API can show lifetime vs daily errors.
DROP FUNCTION IF EXISTS public.maps_deduct_credits(uuid, integer);

CREATE FUNCTION public.maps_deduct_credits(
  p_customer_id uuid,
  p_amount integer
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_rows integer;
  caller_role text := coalesce(auth.role(), '');
  old_used integer;
  old_limit integer;
  old_daily_used integer;
  old_daily_on date;
  today_ist date;
  effective_daily_used integer;
  new_used integer;
  new_daily_used integer;
  daily_limit integer := 1000;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid credit amount';
  END IF;

  -- Prefer service_role. Keep own-customer guard if ever granted elsewhere.
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

  today_ist := (timezone('Asia/Kolkata', now()))::date;

  SELECT
    maps_lead_credits_used,
    maps_lead_credits_limit,
    maps_daily_leads_used,
    maps_daily_leads_on
  INTO
    old_used,
    old_limit,
    old_daily_used,
    old_daily_on
  FROM public.customers
  WHERE id = p_customer_id
  FOR UPDATE;

  IF old_used IS NULL THEN
    RETURN 'INSUFFICIENT_LIFETIME';
  END IF;

  IF old_daily_on IS DISTINCT FROM today_ist THEN
    effective_daily_used := 0;
  ELSE
    effective_daily_used := coalesce(old_daily_used, 0);
  END IF;

  IF effective_daily_used + p_amount > daily_limit THEN
    RETURN 'INSUFFICIENT_DAILY';
  END IF;

  IF old_used + p_amount > old_limit THEN
    RETURN 'INSUFFICIENT_LIFETIME';
  END IF;

  PERFORM set_config('app.allow_maps_credits_update', '1', true);

  UPDATE public.customers
  SET
    maps_lead_credits_used = maps_lead_credits_used + p_amount,
    maps_daily_leads_used = effective_daily_used + p_amount,
    maps_daily_leads_on = today_ist
  WHERE id = p_customer_id
    AND maps_lead_credits_used + p_amount <= maps_lead_credits_limit;

  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  IF updated_rows <> 1 THEN
    RETURN 'INSUFFICIENT_LIFETIME';
  END IF;

  SELECT maps_lead_credits_used, maps_daily_leads_used
  INTO new_used, new_daily_used
  FROM public.customers
  WHERE id = p_customer_id;

  IF new_used <> old_used + p_amount
     OR new_daily_used <> effective_daily_used + p_amount THEN
    RETURN 'INSUFFICIENT_LIFETIME';
  END IF;

  RETURN 'ok';
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
  old_daily_used integer;
  old_daily_on date;
  today_ist date;
  expected_used integer;
  expected_daily integer;
  new_used integer;
  new_daily_used integer;
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

  today_ist := (timezone('Asia/Kolkata', now()))::date;

  SELECT
    maps_lead_credits_used,
    maps_daily_leads_used,
    maps_daily_leads_on
  INTO
    old_used,
    old_daily_used,
    old_daily_on
  FROM public.customers
  WHERE id = p_customer_id
  FOR UPDATE;

  IF old_used IS NULL THEN
    RETURN false;
  END IF;

  expected_used := GREATEST(old_used - p_amount, 0);

  IF old_daily_on IS NOT DISTINCT FROM today_ist THEN
    expected_daily := GREATEST(coalesce(old_daily_used, 0) - p_amount, 0);
  ELSE
    expected_daily := coalesce(old_daily_used, 0);
  END IF;

  PERFORM set_config('app.allow_maps_credits_update', '1', true);

  UPDATE public.customers
  SET
    maps_lead_credits_used = GREATEST(maps_lead_credits_used - p_amount, 0),
    maps_daily_leads_used = CASE
      WHEN maps_daily_leads_on IS NOT DISTINCT FROM today_ist
        THEN GREATEST(coalesce(maps_daily_leads_used, 0) - p_amount, 0)
      ELSE maps_daily_leads_used
    END
  WHERE id = p_customer_id;

  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  IF updated_rows <> 1 THEN
    RETURN false;
  END IF;

  SELECT maps_lead_credits_used, maps_daily_leads_used
  INTO new_used, new_daily_used
  FROM public.customers
  WHERE id = p_customer_id;

  RETURN new_used = expected_used AND new_daily_used = expected_daily;
END;
$$;

REVOKE ALL ON FUNCTION public.maps_deduct_credits(uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.maps_deduct_credits(uuid, integer) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.maps_deduct_credits(uuid, integer) TO service_role;

REVOKE ALL ON FUNCTION public.maps_refund_credits(uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.maps_refund_credits(uuid, integer) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.maps_refund_credits(uuid, integer) TO service_role;

-- Seed today's IST usage from non-failed searches (already charged).
UPDATE public.customers AS c
SET
  maps_daily_leads_on = (timezone('Asia/Kolkata', now()))::date,
  maps_daily_leads_used = least(1000, coalesce(s.charged, 0))
FROM (
  SELECT
    customer_id,
    sum(credits_charged)::integer AS charged
  FROM public.maps_searches
  WHERE status IN ('completed', 'queued', 'submitted')
    AND (timezone('Asia/Kolkata', created_at))::date
      = (timezone('Asia/Kolkata', now()))::date
  GROUP BY customer_id
) AS s
WHERE c.id = s.customer_id;
