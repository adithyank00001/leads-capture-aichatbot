import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/admin";
import { createBotId } from "@/lib/bots/ids";

type Client = SupabaseClient<Database>;

export async function getBotByCustomerId(supabase: Client, customerId: string) {
  const { data, error } = await supabase
    .from("bots")
    .select("id, bot_id, customer_id, business_name, is_active, created_at")
    .eq("customer_id", customerId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function createBotForCustomer(
  supabase: Client,
  input: { customerId: string; businessName?: string },
) {
  const { data, error } = await supabase
    .from("bots")
    .insert({
      bot_id: createBotId(),
      customer_id: input.customerId,
      business_name: input.businessName ?? "My Business",
    })
    .select("id, bot_id, customer_id, business_name, is_active, created_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateBotBusinessName(
  supabase: Client,
  botId: string,
  businessName: string,
) {
  const { data, error } = await supabase
    .from("bots")
    .update({ business_name: businessName })
    .eq("bot_id", botId)
    .select("id, bot_id, customer_id, business_name, is_active, created_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
