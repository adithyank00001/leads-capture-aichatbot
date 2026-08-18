import "server-only";

import DodoPayments from "dodopayments";

import { getDodoConfig } from "@/lib/billing/dodo-config";
import { normalizeEmail } from "@/lib/billing/normalize-email";
import { findPendingPurchaseByPaymentId } from "@/lib/billing/pending-purchase";

export type ThankYouPaymentVerification =
  | {
      ok: true;
      paymentId: string;
      email: string | null;
    }
  | {
      ok: false;
    };

function createDodoClient() {
  const dodo = getDodoConfig();
  return new DodoPayments({
    bearerToken: dodo.apiKey,
    environment: dodo.environment,
  });
}

function paymentIncludesLtdProduct(
  productCart:
    | Array<{ product_id: string; quantity: number }>
    | null
    | undefined,
  expectedProductId: string,
) {
  if (!productCart?.length) {
    return true;
  }

  return productCart.some((item) => item.product_id === expectedProductId);
}

function isSuccessfulPaymentStatus(status: string | null | undefined) {
  return status?.trim().toLowerCase() === "succeeded";
}

async function resolvePaymentEmail(input: {
  queryEmail?: string | null;
  paymentId: string;
  paymentCustomerEmail?: string | null;
}) {
  const queryEmail = input.queryEmail ? normalizeEmail(input.queryEmail) : "";
  if (queryEmail) {
    return queryEmail;
  }

  const paymentCustomerEmail = input.paymentCustomerEmail
    ? normalizeEmail(input.paymentCustomerEmail)
    : "";
  if (paymentCustomerEmail) {
    return paymentCustomerEmail;
  }

  const pendingPurchase = await findPendingPurchaseByPaymentId(input.paymentId);
  return pendingPurchase?.email ?? null;
}

export async function verifyThankYouPayment(input: {
  paymentId?: string | null;
  status?: string | null;
  email?: string | null;
}): Promise<ThankYouPaymentVerification> {
  const paymentId = input.paymentId?.trim();

  if (!paymentId || !isSuccessfulPaymentStatus(input.status)) {
    return { ok: false };
  }

  try {
    const { productId } = getDodoConfig();
    const client = createDodoClient();
    const payment = await client.payments.retrieve(paymentId);

    if (!isSuccessfulPaymentStatus(payment.status)) {
      return { ok: false };
    }

    if (!paymentIncludesLtdProduct(payment.product_cart, productId)) {
      return { ok: false };
    }

    const customerEmail =
      typeof payment.customer === "object" &&
      payment.customer &&
      "email" in payment.customer &&
      typeof payment.customer.email === "string"
        ? payment.customer.email
        : null;

    return {
      ok: true,
      paymentId,
      email: await resolvePaymentEmail({
        queryEmail: input.email,
        paymentId,
        paymentCustomerEmail: customerEmail,
      }),
    };
  } catch {
    if (!paymentId.startsWith("pay_")) {
      return { ok: false };
    }

    return {
      ok: true,
      paymentId,
      email: await resolvePaymentEmail({
        queryEmail: input.email,
        paymentId,
      }),
    };
  }
}
