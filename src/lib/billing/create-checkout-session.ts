import "server-only";

import DodoPayments from "dodopayments";

import { getDodoConfig } from "@/lib/billing/dodo-config";
import { DODO_CHECKOUT_CUSTOMIZATION } from "@/lib/billing/dodo-checkout-theme";
import {
  metaAttributionToMetadata,
  type MetaAttribution,
} from "@/lib/meta/attribution";

function createDodoClient() {
  const dodo = getDodoConfig();
  return new DodoPayments({
    bearerToken: dodo.apiKey,
    environment: dodo.environment,
  });
}

const LOW_FRICTION_CHECKOUT = {
  minimal_address: true,
  billing_address: { country: "AE" as const },
  billing_currency: "AED" as const,
  feature_flags: {
    allow_phone_number_collection: false,
    require_phone_number: false,
    allow_tax_id: false,
    allow_customer_editing_country: true,
    allow_currency_selection: true,
  },
};

export async function createAuthenticatedCheckoutSession(input: {
  userId: string;
  email: string;
  origin: string;
  attribution?: MetaAttribution;
}) {
  const dodo = getDodoConfig();
  const client = createDodoClient();
  const appOrigin = input.origin.replace(/\/+$/, "");
  const attributionMeta = input.attribution
    ? metaAttributionToMetadata(input.attribution)
    : {};

  return client.checkoutSessions.create({
    product_cart: [{ product_id: dodo.productId, quantity: 1 }],
    customer: { email: input.email },
    metadata: { user_id: input.userId, ...attributionMeta },
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

export async function createGuestCheckoutSession(input: {
  origin: string;
  attribution?: MetaAttribution;
}) {
  const dodo = getDodoConfig();
  const client = createDodoClient();
  const appOrigin = input.origin.replace(/\/+$/, "");
  const attributionMeta = input.attribution
    ? metaAttributionToMetadata(input.attribution)
    : {};

  return client.checkoutSessions.create({
    product_cart: [{ product_id: dodo.productId, quantity: 1 }],
    metadata: { flow: "guest", ...attributionMeta },
    return_url: `${appOrigin}/thank-you`,
    cancel_url: `${appOrigin}/checkout/cancel`,
    customization: DODO_CHECKOUT_CUSTOMIZATION,
    ...LOW_FRICTION_CHECKOUT,
  });
}

/** @deprecated Use createAuthenticatedCheckoutSession */
export async function createLifetimeCheckoutSession(input: {
  userId: string;
  email: string;
  origin: string;
  attribution?: MetaAttribution;
}) {
  return createAuthenticatedCheckoutSession(input);
}
