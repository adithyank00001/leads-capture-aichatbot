import type { SupabaseClient } from "@supabase/supabase-js";

import {
  DAILY_LEADS_LIMIT_REACHED_MESSAGE,
  MAPS_DAILY_LEADS_LIMIT,
  MAPS_LEAD_CREDIT_LIMIT,
} from "@/lib/location-leads/constants";
import { getMapsIstTodayDate } from "@/lib/location-leads/ist-date";
import type { Database } from "@/lib/supabase/admin";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { ApiValidationError } from "@/lib/validation/errors";

type Client = SupabaseClient<Database>;

export type MapsCreditBalance = {
  limit: number;
  used: number;
  remaining: number;
  dailyLimit: number;
  dailyUsed: number;
  dailyRemaining: number;
};

export async function getMapsCreditBalance(
  supabase: Client,
  customerId: string,
): Promise<MapsCreditBalance> {
  const { data, error } = await supabase
    .from("customers")
    .select(
      "maps_lead_credits_limit, maps_lead_credits_used, maps_daily_leads_used, maps_daily_leads_on",
    )
    .eq("id", customerId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const limit = data?.maps_lead_credits_limit ?? MAPS_LEAD_CREDIT_LIMIT;
  const used = data?.maps_lead_credits_used ?? 0;
  const todayIst = getMapsIstTodayDate();
  const dailyUsed =
    data?.maps_daily_leads_on === todayIst
      ? (data.maps_daily_leads_used ?? 0)
      : 0;

  return {
    limit,
    used,
    remaining: Math.max(limit - used, 0),
    dailyLimit: MAPS_DAILY_LEADS_LIMIT,
    dailyUsed,
    dailyRemaining: Math.max(MAPS_DAILY_LEADS_LIMIT - dailyUsed, 0),
  };
}

export async function deductMapsCredits(customerId: string, amount: number) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.rpc("maps_deduct_credits", {
    p_customer_id: customerId,
    p_amount: amount,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (data === "INSUFFICIENT_DAILY") {
    throw new ApiValidationError(
      "DAILY_LIMIT_REACHED",
      DAILY_LEADS_LIMIT_REACHED_MESSAGE,
      429,
    );
  }

  if (data !== "ok") {
    throw new ApiValidationError(
      "INSUFFICIENT_CREDITS",
      "Not enough lead credits for this search depth. Please contact the support team to add credits.",
      402,
    );
  }
}

export async function refundMapsCredits(customerId: string, amount: number) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.rpc("maps_refund_credits", {
    p_customer_id: customerId,
    p_amount: amount,
  });

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}
