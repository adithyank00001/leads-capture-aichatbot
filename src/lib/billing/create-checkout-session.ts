import "server-only";

import DodoPayments from "dodopayments";

import { getDodoConfig } from "@/lib/billing/dodo-config";
import { DODO_CHECKOUT_CUSTOMIZATION } from "@/lib/billing/dodo-checkout-theme";

function createDodoClient() {
  const dodo = getDodoConfig();
  return new DodoPayments({
    bearerToken: dodo.apiKey,
    environment: dodo.environment,
  });
}

const LOW_FRICTION_CHECKOUT = {
  minimal_address: true,
  feature_flags: {
    allow_phone_number_collection: false,
    require_phone_number: false,
    allow_tax_id: false,
  },
};

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
    customization: DODO_CHECKOUT_CUSTOMIZATION,
    ...LOW_FRICTION_CHECKOUT,
    feature_flags: {
      ...LOW_FRICTION_CHECKOUT.feature_flags,
      allow_customer_editing_email: false,
    },
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
    cancel_url: `${appOrigin}/`,
    customization: DODO_CHECKOUT_CUSTOMIZATION,
    ...LOW_FRICTION_CHECKOUT,
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
