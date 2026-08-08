import "server-only";

import { serverEnv } from "@/lib/env.server";
import { ApiValidationError } from "@/lib/validation/errors";

export type DodoEnvironment = "test_mode" | "live_mode";

export function getDodoConfig() {
  const apiKey = serverEnv.dodoPaymentsApiKey;
  const productId = serverEnv.dodoLtdProductId;

  if (!apiKey) {
    throw new ApiValidationError(
      "DODO_NOT_CONFIGURED",
      "Payments are not configured yet. Please contact support.",
      503,
    );
  }

  if (!productId) {
    throw new ApiValidationError(
      "DODO_PRODUCT_NOT_CONFIGURED",
      "The lifetime access product is not configured yet. Please contact support.",
      503,
    );
  }

  const environment = serverEnv.dodoPaymentsEnvironment;

  return {
    apiKey,
    productId,
    environment:
      environment === "live_mode" ? ("live_mode" as const) : ("test_mode" as const),
    returnUrl:
      serverEnv.dodoPaymentsReturnUrl ??
      `${serverEnv.appUrl.replace(/\/+$/, "")}/checkout/success`,
  };
}
