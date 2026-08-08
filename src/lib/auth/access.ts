import type { SupabaseClient } from "@supabase/supabase-js";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/admin";
import { ApiValidationError } from "@/lib/validation/errors";

import { requireAuthUser } from "./dashboard";

type Client = SupabaseClient<Database>;

export type CustomerAccess = {
  hasLifetimeAccess: boolean;
  customerId: string | null;
};

export async function getCustomerAccess(
  supabase: Client,
  userId: string,
): Promise<CustomerAccess> {
  const { data, error } = await supabase
    .from("customers")
    .select("id, has_lifetime_access")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return {
    hasLifetimeAccess: data?.has_lifetime_access ?? false,
    customerId: data?.id ?? null,
  };
}

export async function getSessionCustomerAccess(
  userId: string,
): Promise<CustomerAccess> {
  const supabase = await createServerSupabaseClient();
  return getCustomerAccess(supabase as Client, userId);
}

export async function requirePaidDashboardUser() {
  const { supabase, user } = await requireAuthUser();
  const access = await getCustomerAccess(supabase as Client, user.id);

  if (!access.hasLifetimeAccess) {
    throw new ApiValidationError(
      "PAYMENT_REQUIRED",
      "Please purchase lifetime access to continue.",
      402,
    );
  }

  return { supabase, user, access };
}
