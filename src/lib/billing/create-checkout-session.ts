import "server-only";

import DodoPayments from "dodopayments";

import { getDodoConfig } from "@/lib/billing/dodo-config";

function createDodoClient() {
  const dodo = getDodoConfig();
  return new DodoPayments({
    bearerToken: dodo.apiKey,
    environment: dodo.environment,
  });
}

export async function createAuthenticatedCheckoutSession(input: {
  userId: string;
  email: string;
  origin: string;
}) {
  const dodo = getDodoConfig();
  const client = createDodoClient();
  const appOrigin = input.origin.replace(/\/+$/, "");

  return client.checkoutSessions.create({
    product_cart: [{ product_id: dodo.productId, quantity: 1 }],
    customer: { email: input.email },
    metadata: { user_id: input.userId },
    return_url: `${appOrigin}/checkout/success`,
    cancel_url: `${appOrigin}/checkout/cancel`,
  });
}

export async function createGuestCheckoutSession(input: { origin: string }) {
  const dodo = getDodoConfig();
  const client = createDodoClient();
  const appOrigin = input.origin.replace(/\/+$/, "");

  return client.checkoutSessions.create({
    product_cart: [{ product_id: dodo.productId, quantity: 1 }],
    metadata: { flow: "guest" },
    return_url: `${appOrigin}/login?paid=1&next=${encodeURIComponent("/dashboard")}`,
    cancel_url: `${appOrigin}/checkout/cancel`,
  });
}

/** @deprecated Use createAuthenticatedCheckoutSession */
export async function createLifetimeCheckoutSession(input: {
  userId: string;
  email: string;
  origin: string;
}) {
  return createAuthenticatedCheckoutSession(input);
}
