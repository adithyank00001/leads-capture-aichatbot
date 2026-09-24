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

function failLoad(reject: (reason?: unknown) => void) {
  loadingPromise = null;
  reject(new Error("Razorpay failed to load."));
}

/**
 * Load Razorpay Checkout.js on demand (or reuse an in-flight download).
 * Safe to call from idle prefetch — first paint stays free of this script.
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
    const finishOk = () => {
      if (window.Razorpay) {
        resolve(window.Razorpay);
      } else {
        failLoad(reject);
      }
    };

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${RAZORPAY_SCRIPT_URL}"]`,
    );
    if (existing) {
      // Load may have already fired — re-check immediately so we never hang.
      if (window.Razorpay) {
        resolve(window.Razorpay);
        return;
      }
      existing.addEventListener("load", finishOk);
      existing.addEventListener("error", () => failLoad(reject));
      // Microtask: script may have finished between query and listeners.
      queueMicrotask(() => {
        if (window.Razorpay) resolve(window.Razorpay);
      });
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    if ("fetchPriority" in script) {
      (script as HTMLScriptElement & { fetchPriority: string }).fetchPriority =
        "low";
    }
    script.onload = finishOk;
    script.onerror = () => failLoad(reject);
    document.body.appendChild(script);
  });

  return loadingPromise;
}

/**
 * Warm Checkout.js in the background after the page is idle.
 * Failures are silent — Buy click will retry via loadRazorpayCheckout.
 */
export function prefetchRazorpayCheckout(): void {
  void loadRazorpayCheckout().catch(() => undefined);
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
