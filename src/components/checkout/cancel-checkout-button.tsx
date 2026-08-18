"use client";

import { useLayoutEffect, useState, type MouseEvent, type ReactNode } from "react";

import {
  consumePendingDodoCheckoutUrl,
  startLandingCheckout,
} from "@/lib/billing/start-landing-checkout";

export function PendingDodoRedirect({ children }: { children: ReactNode }) {
  useLayoutEffect(() => {
    const checkoutUrl = consumePendingDodoCheckoutUrl();
    if (checkoutUrl) {
      window.location.assign(checkoutUrl);
    }
  }, []);

  return children;
}

export function CancelCheckoutButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setLoading(true);

    try {
      await startLandingCheckout();
    } finally {
      setLoading(false);
    }
  }

  return (
    <a
      href="/checkout"
      onClick={handleClick}
      aria-busy={loading}
      aria-disabled={loading}
      className="animate-checkout-cancel-cta-pulse mt-7 inline-flex w-full items-center justify-center rounded-[13px] bg-gradient-to-b from-[#E36F02] to-[#FDA85A] px-4 py-3.5 text-[17px] font-semibold text-white shadow-[0px_2px_10.1px_0px_#FC7B0233]"
    >
      {loading ? "Starting checkout..." : "Unlock a Lifetime of Leads →"}
    </a>
  );
}
