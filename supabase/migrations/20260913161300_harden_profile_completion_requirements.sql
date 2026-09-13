-- Profile completion must include real name + mobile.
-- Also harden protect_customer_entitlements for first-time completion.

ALTER TABLE public.customers
  DROP CONSTRAINT IF EXISTS customers_profile_completed_requires_fields_chk;

ALTER TABLE public.customers
  ADD CONSTRAINT customers_profile_completed_requires_fields_chk
  CHECK (
    profile_completed_at IS NULL
    OR (
      full_name IS NOT NULL
      AND length(btrim(full_name)) >= 2
      AND mobile_phone IS NOT NULL
      AND length(regexp_replace(mobile_phone, '\D', '', 'g')) >= 8
    )
  );

CREATE OR REPLACE FUNCTION public.protect_customer_entitlements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mobile_digits text;
BEGIN
  IF auth.uid() IS NULL OR coalesce(auth.role(), '') = 'service_role' THEN
    RETURN NEW;
  END IF;

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
