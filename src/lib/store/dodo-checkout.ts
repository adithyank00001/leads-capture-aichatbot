import "server-only";

import DodoPayments from "dodopayments";

import { DODO_CHECKOUT_CUSTOMIZATION } from "@/lib/billing/dodo-checkout-theme";
import { serverEnv } from "@/lib/env.server";
import { ApiValidationError } from "@/lib/validation/errors";
import {
  metaAttributionToMetadata,
  type MetaAttribution,
} from "@/lib/meta/attribution";

export type DodoEnvironment = "test_mode" | "live_mode";

function getDodoEnvironment(): DodoEnvironment {
  return serverEnv.dodoPaymentsEnvironment === "live_mode"
    ? "live_mode"
    : "test_mode";
}

export function createDodoPaymentsClient() {
  const apiKey = serverEnv.dodoPaymentsApiKey;
  if (!apiKey) {
    throw new ApiValidationError(
      "DODO_NOT_CONFIGURED",
      "Payments are not configured yet. Please contact support.",
      503,
    );
  }

  return new DodoPayments({
    bearerToken: apiKey,
    environment: getDodoEnvironment(),
  });
}

export function getDodoStoreProductId() {
  const productId = serverEnv.dodoStoreProductId?.trim();
  if (!productId) {
    throw new ApiValidationError(
      "DODO_STORE_PRODUCT_NOT_CONFIGURED",
      "Store product is not configured yet. Add DODO_STORE_PRODUCT_ID to env.",
      503,
    );
  }
  return productId;
}

/** Same orange AI-agent checkout look, store CTA copy. */
export const DODO_STORE_CHECKOUT_CUSTOMIZATION = {
  ...DODO_CHECKOUT_CUSTOMIZATION,
  theme_config: {
    ...DODO_CHECKOUT_CUSTOMIZATION.theme_config,
    pay_button_text: "Download My Leads Now",
  },
} as typeof DODO_CHECKOUT_CUSTOMIZATION;

/**
 * Short India checkout: name + email + zip only.
 * Do NOT set allowed_payment_method_types — filtering to UPI breaks
 * checkout with NO_ELIGIBLE_PAYMENT_METHODS until Adaptive Currency
 * is enabled on the Dodo merchant account.
 */
const STORE_LOW_FRICTION = {
  minimal_address: true,
  billing_address: { country: "IN" as const },
  billing_currency: "INR" as const,
  feature_flags: {
    allow_phone_number_collection: false,
    require_phone_number: false,
    allow_tax_id: false,
    require_tax_id: false,
    allow_discount_code: false,
    allow_currency_selection: false,
    allow_customer_editing_country: true,
    allow_customer_editing_tax_id: false,
    allow_customer_editing_business_name: false,
    redirect_immediately: true,
  },
};

/**
 * Guest checkout for the digital store product.
 * Returns a Dodo hosted checkout URL (test_mode or live_mode from env).
 */
export async function createStoreDodoCheckoutSession(input: {
  origin: string;
  quantity?: number;
  attribution?: MetaAttribution;
}) {
  const client = createDodoPaymentsClient();
  const productId = getDodoStoreProductId();
  const appOrigin = input.origin.replace(/\/+$/, "");
  const quantity = Math.min(20, Math.max(1, input.quantity ?? 1));
  const attributionMeta = input.attribution
    ? metaAttributionToMetadata(input.attribution)
    : {};

  return client.checkoutSessions.create({
    product_cart: [{ product_id: productId, quantity }],
    metadata: {
      flow: "store_digital",
      product_slug: "pan-india-leads-2026",
      ...attributionMeta,
    },
    return_url: `${appOrigin}/store/success`,
    cancel_url: `${appOrigin}/store/product`,
    customization: DODO_STORE_CHECKOUT_CUSTOMIZATION,
    ...STORE_LOW_FRICTION,
  });
}
