import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/admin";

type Client = SupabaseClient<Database>;

export async function getCustomerByUserId(supabase: Client, userId: string) {
  const { data, error } = await supabase
    .from("customers")
    .select(
      "id, user_id, email, created_at, has_lifetime_access, lifetime_access_granted_at, dodo_payment_id, dodo_customer_id",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function createCustomer(
  supabase: Client,
  input: { userId: string; email: string },
) {
  const { data, error } = await supabase
    .from("customers")
    .insert({
      user_id: input.userId,
      email: input.email,
    })
    .select(
      "id, user_id, email, created_at, has_lifetime_access, lifetime_access_granted_at, dodo_payment_id, dodo_customer_id",
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
