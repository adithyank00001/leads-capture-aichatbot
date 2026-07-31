import {
  INVALID_DOMAIN_ERROR,
  REQUIRED_DOMAIN_ERROR,
  SINGLE_DOMAIN_ERROR,
} from "@/lib/validation/bot-settings";

import { PUBLIC_ERROR_MESSAGE } from "@/lib/errors/public";

const DOMAIN_ERRORS = new Set([
  REQUIRED_DOMAIN_ERROR,
  SINGLE_DOMAIN_ERROR,
  INVALID_DOMAIN_ERROR,
]);

export function getCustomerErrorMessage(
  error: unknown,
  fallback = PUBLIC_ERROR_MESSAGE,
) {
  if (error instanceof Error) {
    const message = error.message.trim();

    if (DOMAIN_ERRORS.has(message)) {
      return message;
    }

    if (message.toLowerCase().includes("email not confirmed")) {
      return "Your email is not confirmed yet. Please open the confirmation email and click the link, then try logging in again.";
    }

    if (message.length > 0 && !message.toLowerCase().includes("supabase")) {
      return message;
    }
  }

  return fallback;
}

export function getLeadsLoadErrorMessage(error: unknown) {
  return getCustomerErrorMessage(
    error,
    "Could not load leads. Please try again.",
  );
}

export function getLeadsDeleteErrorMessage(error: unknown) {
  return getCustomerErrorMessage(
    error,
    "Could not delete this lead. Please try again.",
  );
}
