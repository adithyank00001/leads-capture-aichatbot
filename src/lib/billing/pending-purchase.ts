import "server-only";

import { normalizeEmail } from "@/lib/billing/normalize-email";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function insertPendingLifetimePurchase(input: {
  email: string;
  dodoPaymentId: string;
  dodoCustomerId?: string | null;
}) {
  const admin = getSupabaseAdmin();
  const normalizedEmail = normalizeEmail(input.email);

  const { data: existing, error: lookupError } = await admin
    .from("pending_lifetime_purchases")
    .select("id")
    .eq("dodo_payment_id", input.dodoPaymentId)
    .maybeSingle();

  if (lookupError) {
    throw new Error(lookupError.message);
  }

  if (existing) {
    return { inserted: false as const };
  }

  const { error: insertError } = await admin
    .from("pending_lifetime_purchases")
    .insert({
      email: normalizedEmail,
      dodo_payment_id: input.dodoPaymentId,
      dodo_customer_id: input.dodoCustomerId ?? null,
    });

  if (insertError) {
    throw new Error(insertError.message);
  }

  return { inserted: true as const };
}

export async function findUnclaimedPendingPurchasesByEmail(email: string) {
  const admin = getSupabaseAdmin();
  const normalizedEmail = normalizeEmail(email);

  const { data, error } = await admin
    .from("pending_lifetime_purchases")
    .select(
      "id, email, dodo_payment_id, dodo_customer_id, paid_at, claimed_at, claimed_user_id",
    )
    .is("claimed_at", null)
    .eq("email", normalizedEmail);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function markPendingPurchasesClaimed(input: {
  ids: string[];
  userId: string;
}) {
  if (input.ids.length === 0) {
    return;
  }

  const admin = getSupabaseAdmin();
  const claimedAt = new Date().toISOString();

  const { error } = await admin
    .from("pending_lifetime_purchases")
    .update({
      claimed_at: claimedAt,
      claimed_user_id: input.userId,
    })
    .in("id", input.ids)
    .is("claimed_at", null);

  if (error) {
    throw new Error(error.message);
  }
}
