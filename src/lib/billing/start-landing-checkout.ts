const CHECKOUT_FALLBACK = "/checkout?error=checkout_failed";

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

    if (body.ok && body.data.alreadyPaid && body.data.redirectUrl) {
      window.location.assign(body.data.redirectUrl);
      return;
    }

    if (body.ok && body.data.checkoutUrl) {
      window.location.assign(body.data.checkoutUrl);
      return;
    }

    window.location.assign(CHECKOUT_FALLBACK);
  } catch {
    window.location.assign(CHECKOUT_FALLBACK);
  } finally {
    checkoutStartInFlight = false;
  }
}
