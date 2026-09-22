"use client";

const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

export type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

export type RazorpayCheckoutOptions = {
  key: string;
  amount: number | string;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: {
    email?: string;
    name?: string;
    contact?: string;
  };
  /** Keep contact fields editable so Razorpay can collect email. */
  readonly?: {
    email?: boolean;
    name?: boolean;
    contact?: boolean;
  };
  method?: {
    upi?: boolean;
    card?: boolean;
    netbanking?: boolean;
    wallet?: boolean;
    emi?: boolean;
    paylater?: boolean;
  };
  theme?: { color?: string };
  handler: (response: RazorpaySuccessResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
};

type RazorpayInstance = {
  open: () => void;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
};

type RazorpayConstructor = new (options: RazorpayCheckoutOptions) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

let loadingPromise: Promise<RazorpayConstructor> | null = null;

/**
 * Load Razorpay Checkout.js only when the buyer pays.
 * Keeps the product page fast (no script on first paint).
 */
export function loadRazorpayCheckout(): Promise<RazorpayConstructor> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay can only open in the browser."));
  }

  if (window.Razorpay) {
    return Promise.resolve(window.Razorpay);
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${RAZORPAY_SCRIPT_URL}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => {
        if (window.Razorpay) resolve(window.Razorpay);
        else reject(new Error("Razorpay failed to load."));
      });
      existing.addEventListener("error", () => {
        loadingPromise = null;
        reject(new Error("Razorpay failed to load."));
      });
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      if (window.Razorpay) {
        resolve(window.Razorpay);
      } else {
        loadingPromise = null;
        reject(new Error("Razorpay failed to load."));
      }
    };
    script.onerror = () => {
      loadingPromise = null;
      reject(new Error("Razorpay failed to load."));
    };
    document.body.appendChild(script);
  });

  return loadingPromise;
}

/**
 * Open Razorpay Standard Checkout with default payment methods
 * (UPI, cards, netbanking, wallets — whatever Razorpay enables on the account).
 */
export async function openRazorpayCheckout(
  options: RazorpayCheckoutOptions,
): Promise<void> {
  const Razorpay = await loadRazorpayCheckout();
  const checkout = new Razorpay(options);
  checkout.open();
}

/** @deprecated Prefer openRazorpayCheckout — keeps Razorpay default methods. */
export async function openRazorpayUpiCheckout(
  options: RazorpayCheckoutOptions,
): Promise<void> {
  return openRazorpayCheckout(options);
}
