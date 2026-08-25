import "server-only";

import DodoPayments from "dodopayments";

import { getDodoConfig } from "@/lib/billing/dodo-config";
import { normalizeEmail } from "@/lib/billing/normalize-email";
import { findPendingPurchaseByPaymentId } from "@/lib/billing/pending-purchase";
import {
  metaCustomerInfoFromDodo,
  type MetaCustomerInfo,
} from "@/lib/meta/user-data";

export type ThankYouPaymentVerification =
  | {
      ok: true;
      paymentId: string;
      email: string | null;
      customer: MetaCustomerInfo | null;
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

function readCustomerName(customer: unknown): string | null {
  if (
    typeof customer === "object" &&
    customer &&
    "name" in customer &&
    typeof customer.name === "string"
  ) {
    const name = customer.name.trim();
    return name || null;
  }
  return null;
}

function readCustomerId(customer: unknown): string | null {
  if (
    typeof customer === "object" &&
    customer &&
    "customer_id" in customer &&
    typeof customer.customer_id === "string"
  ) {
    const id = customer.customer_id.trim();
    return id || null;
  }
  return null;
}

function readOptionalString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed || null;
}

function readUserIdFromMetadata(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }
  return readOptionalString((metadata as Record<string, unknown>).user_id);
}

function readBilling(billing: unknown) {
  if (!billing || typeof billing !== "object") {
    return null;
  }

  const record = billing as Record<string, unknown>;
  return {
    country: typeof record.country === "string" ? record.country : null,
    city: typeof record.city === "string" ? record.city : null,
    state: typeof record.state === "string" ? record.state : null,
    street: typeof record.street === "string" ? record.street : null,
    zipcode: typeof record.zipcode === "string" ? record.zipcode : null,
  };
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

    const email = await resolvePaymentEmail({
      queryEmail: input.email,
      paymentId,
      paymentCustomerEmail: customerEmail,
    });

    return {
      ok: true,
      paymentId,
      email,
      customer: metaCustomerInfoFromDodo({
        email,
        name: readCustomerName(payment.customer),
        cardHolderName: readOptionalString(payment.card_holder_name),
        billing: readBilling(payment.billing),
        dodoCustomerId: readCustomerId(payment.customer),
        userId: readUserIdFromMetadata(payment.metadata),
      }),
    };
  } catch {
    if (!paymentId.startsWith("pay_")) {
      return { ok: false };
    }

    const email = await resolvePaymentEmail({
      queryEmail: input.email,
      paymentId,
    });

    return {
      ok: true,
      paymentId,
      email,
      customer: email ? { email } : null,
    };
  }
}
