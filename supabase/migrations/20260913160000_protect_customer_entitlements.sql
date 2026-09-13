-- Prevent authenticated users from self-granting product access or editing a finished profile.

CREATE OR REPLACE FUNCTION public.protect_customer_entitlements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admin / SQL / service_role may change anything.
  -- Authenticated end-users always have auth.uid(); lock entitlements for them.
  IF auth.uid() IS NULL OR coalesce(auth.role(), '') = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Authenticated users cannot self-grant product access or billing fields.
  NEW.has_lifetime_access := OLD.has_lifetime_access;
  NEW.lifetime_access_granted_at := OLD.lifetime_access_granted_at;
  NEW.has_maps_access := OLD.has_maps_access;
  NEW.maps_access_granted_at := OLD.maps_access_granted_at;
  NEW.dodo_payment_id := OLD.dodo_payment_id;
  NEW.dodo_customer_id := OLD.dodo_customer_id;
  NEW.maps_lead_credits_limit := OLD.maps_lead_credits_limit;
  NEW.maps_lead_credits_used := OLD.maps_lead_credits_used;
  NEW.email := OLD.email;
  NEW.user_id := OLD.user_id;

  -- One-time profile: once completed, lock name / mobile / completed timestamp.
  IF OLD.profile_completed_at IS NOT NULL THEN
    NEW.full_name := OLD.full_name;
    NEW.mobile_phone := OLD.mobile_phone;
    NEW.profile_completed_at := OLD.profile_completed_at;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_customer_entitlements ON public.customers;
CREATE TRIGGER trg_protect_customer_entitlements
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_customer_entitlements();
