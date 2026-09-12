-- Harden Product 2 RPC grants and trigger search_path

CREATE OR REPLACE FUNCTION public.set_maps_searches_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_expired_maps_searches() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cleanup_expired_maps_searches() FROM anon;
REVOKE ALL ON FUNCTION public.cleanup_expired_maps_searches() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_maps_searches() TO service_role;

REVOKE ALL ON FUNCTION public.maps_deduct_credits(uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.maps_deduct_credits(uuid, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.maps_deduct_credits(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.maps_deduct_credits(uuid, integer) TO service_role;

REVOKE ALL ON FUNCTION public.maps_refund_credits(uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.maps_refund_credits(uuid, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.maps_refund_credits(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.maps_refund_credits(uuid, integer) TO service_role;
