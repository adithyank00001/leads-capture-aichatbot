import "server-only";

import { normalizeEmail } from "@/lib/billing/normalize-email";
import {
  findUnclaimedPendingPurchasesByEmail,
  markPendingPurchasesClaimed,
} from "@/lib/billing/pending-purchase";
import { ensureCustomerOnboarding } from "@/lib/dashboard/onboarding";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type ClaimPendingPurchaseResult = {
  claimed: boolean;
};

export async function claimPendingLifetimePurchase(input: {
  userId: string;
  email: string;
}): Promise<ClaimPendingPurchaseResult> {
  const normalizedEmail = normalizeEmail(input.email);

  if (!normalizedEmail) {
    return { claimed: false };
  }

  const pendingPurchases = await findUnclaimedPendingPurchasesByEmail(
    normalizedEmail,
  );

  if (pendingPurchases.length === 0) {
    return { claimed: false };
  }

  const admin = getSupabaseAdmin();
  const grantedAt = new Date().toISOString();
  const primaryPurchase = pendingPurchases[0];

  const { data: existingCustomer, error: customerLookupError } = await admin
    .from("customers")
    .select("id, has_lifetime_access")
    .eq("user_id", input.userId)
    .maybeSingle();

  if (customerLookupError) {
    throw new Error(customerLookupError.message);
  }

  if (existingCustomer?.has_lifetime_access) {
    await markPendingPurchasesClaimed({
      ids: pendingPurchases.map((purchase) => purchase.id),
      userId: input.userId,
    });
    return { claimed: true };
  }

  if (existingCustomer) {
    const { error: updateError } = await admin
      .from("customers")
      .update({
        has_lifetime_access: true,
        lifetime_access_granted_at: grantedAt,
        dodo_payment_id: primaryPurchase.dodo_payment_id,
        dodo_customer_id: primaryPurchase.dodo_customer_id,
        email: normalizedEmail,
      })
      .eq("id", existingCustomer.id);

    if (updateError) {
      throw new Error(updateError.message);
    }
  } else {
    const { error: insertError } = await admin.from("customers").insert({
      user_id: input.userId,
      email: normalizedEmail,
      has_lifetime_access: true,
      lifetime_access_granted_at: grantedAt,
      dodo_payment_id: primaryPurchase.dodo_payment_id,
      dodo_customer_id: primaryPurchase.dodo_customer_id,
    });

    if (insertError) {
      throw new Error(insertError.message);
    }
  }

  await ensureCustomerOnboarding(admin, {
    userId: input.userId,
    email: normalizedEmail,
  });

  await markPendingPurchasesClaimed({
    ids: pendingPurchases.map((purchase) => purchase.id),
    userId: input.userId,
  });

  return { claimed: true };
}
