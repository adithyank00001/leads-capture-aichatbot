import "server-only";

import DodoPayments from "dodopayments";

import { getDodoConfig } from "@/lib/billing/dodo-config";

export async function createLifetimeCheckoutSession(input: {
  userId: string;
  email: string;
  origin: string;
}) {
  const dodo = getDodoConfig();
  const client = new DodoPayments({
    bearerToken: dodo.apiKey,
    environment: dodo.environment,
  });

  const appOrigin = input.origin.replace(/\/+$/, "");

  return client.checkoutSessions.create({
    product_cart: [{ product_id: dodo.productId, quantity: 1 }],
    customer: { email: input.email },
    metadata: { user_id: input.userId },
    return_url: `${appOrigin}/checkout/success`,
    cancel_url: `${appOrigin}/checkout/cancel`,
  });
}
