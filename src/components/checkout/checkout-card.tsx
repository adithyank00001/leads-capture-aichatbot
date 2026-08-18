"use client";

import { useState } from "react";

import { FormattedPrice } from "@/components/ui/formatted-price";
import { publicConfig } from "@/lib/config";
import { cn } from "@/lib/utils";

type CheckoutResponse =
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

const CHECKOUT_ERROR_MESSAGES: Record<string, string> = {
  missing_email:
    "We still need an email on your account. Sign in again, then come back.",
  checkout_failed:
    "That didn't go through. You're still one click away — try again.",
  dodo_not_configured:
    "Payments are not ready yet. Please contact support.",
  dodo_product_not_configured:
    "Payments are not ready yet. Please contact support.",
};

function GuaranteeShield() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-7 shrink-0 sm:size-8">
      <path
        fill="#16A34A"
        d="M12 1.5 4 5v5.5c0 5.25 3.5 10 8 11.5 4.5-1.5 8-6.25 8-11.5V5l-8-3.5z"
      />
      <path
        d="M8.5 12.5 11 15l4.5-5"
        fill="none"
        stroke="white"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type CheckoutCardProps = {
  errorCode?: string | null;
  mode?: "guest" | "authenticated";
};

export function CheckoutCard({
  errorCode,
  mode = "authenticated",
}: CheckoutCardProps) {
  const isGuest = mode === "guest";
  const [error, setError] = useState<string | null>(
    errorCode
      ? (CHECKOUT_ERROR_MESSAGES[errorCode] ??
        "That didn't go through. You're still one click away — try again.")
      : null,
  );
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(
        isGuest ? "/api/checkout/guest" : "/api/checkout",
        {
          method: "POST",
        },
      );
      const body = (await response.json()) as CheckoutResponse;

      if (!body.ok) {
        setError(
          CHECKOUT_ERROR_MESSAGES[body.error.code.toLowerCase()] ??
            "That didn't go through. You're still one click away — try again.",
        );
        return;
      }

      if (body.data.alreadyPaid && body.data.redirectUrl) {
        window.location.assign(body.data.redirectUrl);
        return;
      }

      if (body.data.checkoutUrl) {
        window.location.assign(body.data.checkoutUrl);
        return;
      }

      setError(
        "That didn't go through. You're still one click away — try again.",
      );
    } catch {
      setError(
        "That didn't go through. You're still one click away — try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-lg">
      <div className="rounded-2xl border border-[#8B9AAB] bg-white px-6 py-8 shadow-[0_8px_32px_rgba(17,36,55,0.12)] sm:px-8 sm:py-10">
        <p className="text-center text-[13px] font-bold uppercase italic tracking-wide text-[var(--landing-orange-hover)]">
          Almost yours
        </p>

        <h1 className="mt-3 text-balance text-center text-[28px] font-bold leading-[1.15] tracking-tight text-[var(--landing-navy)] sm:text-[34px]">
          You&apos;re one click away from a lifetime of leads.
        </h1>

        <p className="mx-auto mt-5 inline-flex w-full flex-wrap items-center justify-center gap-1.5 text-[18px] font-bold leading-tight text-[#16A34A] sm:text-[22px]">
          <span>just 1 Deal</span>
          <span aria-hidden>&gt;</span>
          <FormattedPrice
            amount={publicConfig.lifetimeAccessPriceUsd}
            weight="bold"
            className="font-bold text-[#16A34A]"
          />
        </p>
        <p className="mt-2 text-center text-[20px] font-bold italic text-[#16A34A] sm:text-[24px]">
          200X ROI
        </p>

        {error ? (
          <p
            className="mt-5 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-center text-[15px] font-medium leading-snug text-[#B42318]"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <button
          type="button"
          disabled={loading}
          onClick={handleCheckout}
          className={cn(
            "mt-6 w-full rounded-[14px] bg-gradient-to-b from-[#FDA85A] to-[#FC7B02] p-[1px] disabled:pointer-events-none disabled:opacity-80",
            !loading && "animate-checkout-cancel-cta-pulse",
          )}
        >
          <span className="flex w-full items-center justify-center rounded-[13px] bg-gradient-to-b from-[#E36F02] to-[#FDA85A] px-4 py-3.5 text-[18px] font-semibold text-white shadow-[0px_2px_10.1px_0px_#FC7B0233]">
            {loading ? "Starting checkout..." : "Unlock a Lifetime of Leads →"}
          </span>
        </button>

        <p className="mt-7 text-center text-[15px] font-bold uppercase tracking-wide text-[#16A34A]">
          Try It Risk-Free
        </p>
        <div className="relative mt-5 rounded-xl border border-[#86EFAC] bg-[#F0FDF4] px-4 pb-4 pt-5 text-center">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 bg-[#F0FDF4] px-1.5">
            <GuaranteeShield />
          </div>
          <p className="text-[17px] font-bold uppercase leading-tight text-[#16A34A]">
            100% Money-Back Guarantee
          </p>
          <p className="mt-1 text-[16px] font-bold uppercase leading-snug text-[#16A34A]">
            No-questions-asked
          </p>
        </div>
      </div>
    </div>
  );
}
