import type { SupabaseClient } from "@supabase/supabase-js";

import { MAPS_LEAD_CREDIT_LIMIT } from "@/lib/location-leads/constants";
import type { Database } from "@/lib/supabase/admin";
import { ApiValidationError } from "@/lib/validation/errors";

type Client = SupabaseClient<Database>;

export type MapsCreditBalance = {
  limit: number;
  used: number;
  remaining: number;
};

export async function getMapsCreditBalance(
  supabase: Client,
  customerId: string,
): Promise<MapsCreditBalance> {
  const { data, error } = await supabase
    .from("customers")
    .select("maps_lead_credits_limit, maps_lead_credits_used")
    .eq("id", customerId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const limit = data?.maps_lead_credits_limit ?? MAPS_LEAD_CREDIT_LIMIT;
  const used = data?.maps_lead_credits_used ?? 0;

  return {
    limit,
    used,
    remaining: Math.max(limit - used, 0),
  };
}

export async function deductMapsCredits(
  supabase: Client,
  customerId: string,
  amount: number,
) {
  const { data, error } = await supabase.rpc("maps_deduct_credits", {
    p_customer_id: customerId,
    p_amount: amount,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new ApiValidationError(
      "INSUFFICIENT_CREDITS",
      "Not enough lead credits for this search depth.",
      402,
    );
  }
}

export async function refundMapsCredits(
  supabase: Client,
  customerId: string,
  amount: number,
) {
  const { data, error } = await supabase.rpc("maps_refund_credits", {
    p_customer_id: customerId,
    p_amount: amount,
  });

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}
