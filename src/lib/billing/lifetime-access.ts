import "server-only";

import { getDodoConfig } from "@/lib/billing/dodo-config";
import { normalizeEmail } from "@/lib/billing/normalize-email";
import { insertPendingLifetimePurchase } from "@/lib/billing/pending-purchase";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type PaymentWebhookData = {
  payment_id: string;
  metadata: Record<string, unknown>;
  customer: {
    customer_id: string;
    email: string;
  };
  product_cart?: Array<{
    product_id: string;
    quantity: number;
  }>;
};

function getUserIdFromMetadata(metadata: Record<string, unknown>) {
  const userId = metadata.user_id;

  if (typeof userId !== "string" || userId.length === 0) {
    return null;
  }

  return userId;
}

function paymentIncludesLtdProduct(
  productCart: PaymentWebhookData["product_cart"],
  expectedProductId: string,
) {
  if (!productCart?.length) {
    return true;
  }

  return productCart.some((item) => item.product_id === expectedProductId);
}

async function grantLifetimeAccessForAuthenticatedUser(
  payment: PaymentWebhookData,
  userId: string,
) {
  const { productId } = getDodoConfig();

  if (!paymentIncludesLtdProduct(payment.product_cart, productId)) {
    return;
  }

  const admin = getSupabaseAdmin();
  const grantedAt = new Date().toISOString();

  const { data: existingByPayment, error: paymentLookupError } = await admin
    .from("customers")
    .select("id")
    .eq("dodo_payment_id", payment.payment_id)
    .maybeSingle();

  if (paymentLookupError) {
    throw new Error(paymentLookupError.message);
  }

  if (existingByPayment) {
    return;
  }

  const { data: existingCustomer, error: customerLookupError } = await admin
    .from("customers")
    .select("id, has_lifetime_access")
    .eq("user_id", userId)
    .maybeSingle();

  if (customerLookupError) {
    throw new Error(customerLookupError.message);
  }

  if (existingCustomer?.has_lifetime_access) {
    return;
  }

  if (existingCustomer) {
    const { error: updateError } = await admin
      .from("customers")
      .update({
        has_lifetime_access: true,
        lifetime_access_granted_at: grantedAt,
        dodo_payment_id: payment.payment_id,
        dodo_customer_id: payment.customer.customer_id,
      })
      .eq("id", existingCustomer.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return;
  }

  const { error: insertError } = await admin.from("customers").insert({
    user_id: userId,
    email: payment.customer.email,
    has_lifetime_access: true,
    lifetime_access_granted_at: grantedAt,
    dodo_payment_id: payment.payment_id,
    dodo_customer_id: payment.customer.customer_id,
  });

  if (insertError) {
    throw new Error(insertError.message);
  }
}

async function storeGuestLifetimePurchase(payment: PaymentWebhookData) {
  const { productId } = getDodoConfig();

  if (!paymentIncludesLtdProduct(payment.product_cart, productId)) {
    return;
  }

  const email = normalizeEmail(payment.customer.email);

  if (!email) {
    return;
  }

  await insertPendingLifetimePurchase({
    email,
    dodoPaymentId: payment.payment_id,
    dodoCustomerId: payment.customer.customer_id,
  });
}

export async function grantLifetimeAccessFromPayment(payment: PaymentWebhookData) {
  const userId = getUserIdFromMetadata(payment.metadata);

  if (userId) {
    await grantLifetimeAccessForAuthenticatedUser(payment, userId);
    return;
  }

  await storeGuestLifetimePurchase(payment);
}
