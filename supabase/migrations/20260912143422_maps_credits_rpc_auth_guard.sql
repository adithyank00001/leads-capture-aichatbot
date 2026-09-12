-- Ensure credit RPCs only affect the caller's own customer row
-- (service_role still allowed for admin/ops).

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
  caller_role text := coalesce(auth.role(), '');
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

  UPDATE public.customers
  SET maps_lead_credits_used = GREATEST(maps_lead_credits_used - p_amount, 0)
  WHERE id = p_customer_id;

  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  RETURN updated_rows = 1;
END;
$$;
