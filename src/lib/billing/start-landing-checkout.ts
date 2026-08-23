import { trackInitiateCheckout } from "@/lib/meta/browser-track";

const CHECKOUT_FALLBACK = "/checkout?error=checkout_failed";
const PENDING_DODO_CHECKOUT_KEY = "pending-dodo-checkout-url";
const CHECKOUT_CANCEL_PATH = "/checkout/cancel";

function isOnCheckoutCancelPage() {
  return window.location.pathname === CHECKOUT_CANCEL_PATH;
}

export function isSafeInternalRedirect(path: string) {
  return path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/\\");
}

export function isSafeDodoCheckoutUrl(checkoutUrl: string) {
  try {
    const url = new URL(checkoutUrl);
    return url.protocol === "https:" && url.hostname.endsWith(".dodopayments.com");
  } catch {
    return false;
  }
}

export function consumePendingDodoCheckoutUrl() {
  try {
    const checkoutUrl = sessionStorage.getItem(PENDING_DODO_CHECKOUT_KEY);
    if (!checkoutUrl) {
      return null;
    }

    sessionStorage.removeItem(PENDING_DODO_CHECKOUT_KEY);
    return isSafeDodoCheckoutUrl(checkoutUrl) ? checkoutUrl : null;
  } catch {
    return null;
  }
}

export function goToDodoCheckout(checkoutUrl: string) {
  if (!isSafeDodoCheckoutUrl(checkoutUrl)) {
    window.location.assign(CHECKOUT_FALLBACK);
    return;
  }

  trackInitiateCheckout();

  if (isOnCheckoutCancelPage()) {
    window.location.assign(checkoutUrl);
    return;
  }

  try {
    sessionStorage.setItem(PENDING_DODO_CHECKOUT_KEY, checkoutUrl);
  } catch {
    window.location.assign(checkoutUrl);
    return;
  }

  window.location.assign(CHECKOUT_CANCEL_PATH);
}

type CheckoutStartResponse =
  | {
      ok: true;
      data: {
        checkoutUrl?: string;
        alreadyPaid?: boolean;
        redirectUrl?: string;
      };
    }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
      };
    };

let checkoutStartInFlight = false;

export async function startLandingCheckout() {
  if (checkoutStartInFlight) {
    return;
  }

  checkoutStartInFlight = true;

  try {
    const response = await fetch("/api/checkout/start", {
      method: "POST",
    });
    const body = (await response.json()) as CheckoutStartResponse;

    if (
      body.ok &&
      body.data.alreadyPaid &&
      body.data.redirectUrl &&
      isSafeInternalRedirect(body.data.redirectUrl)
    ) {
      window.location.assign(body.data.redirectUrl);
      return;
    }

    if (body.ok && body.data.checkoutUrl) {
      goToDodoCheckout(body.data.checkoutUrl);
      return;
    }

    window.location.assign(CHECKOUT_FALLBACK);
  } catch {
    window.location.assign(CHECKOUT_FALLBACK);
  } finally {
    checkoutStartInFlight = false;
  }
}
