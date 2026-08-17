"use client";

import { useState } from "react";

import { BrandLogo } from "@/components/marketing/brand-logo";
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
      <div className="mb-8 flex justify-center">
        <BrandLogo size="sm" href="/" />
      </div>

      <div className="rounded-2xl border border-[#8B9AAB] bg-white px-6 py-8 shadow-[0_8px_32px_rgba(17,36,55,0.12)] sm:px-8 sm:py-10">
        <p className="text-center text-[13px] font-bold uppercase italic tracking-wide text-[var(--landing-orange-hover)]">
          Almost yours
        </p>

        <h1 className="mt-3 text-balance text-center text-[28px] font-bold leading-[1.15] tracking-tight text-[var(--landing-navy)] sm:text-[34px]">
          You&apos;re one click away from a lifetime of leads.
        </h1>

        <p className="mx-auto mt-4 max-w-md text-pretty text-center text-[16px] font-medium leading-relaxed text-[#5B6B7C] sm:text-[17px]">
          Every visitor who leaves without talking is money walking out the
          door. Stop that today — and keep it stopped forever.
        </p>

        <div className="mt-7 rounded-xl border border-[var(--landing-orange)]/25 bg-[#FFF7ED] px-5 py-5 text-center">
          <p className="text-[13px] font-bold uppercase tracking-wide text-[var(--landing-orange-hover)]">
            Pay once. Leads for life.
          </p>
          <p className="mt-2 flex items-center justify-center gap-3 text-[var(--landing-navy)]">
            <FormattedPrice
              amount={publicConfig.lifetimeAccessPriceUsd}
              weight="bold"
              className="text-[40px] font-bold"
            />
            <FormattedPrice
              amount={publicConfig.lifetimeAccessOriginalPrice}
              lineThrough
              weight="regular"
              className="text-[18px] text-[#5B6B7C]"
            />
          </p>
        </div>

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
            "mt-6 w-full rounded-[14px] bg-gradient-to-b from-[#FDA85A] to-[#FC7B02] p-[1px] transition-transform hover:scale-[1.03] disabled:pointer-events-none disabled:opacity-80",
          )}
        >
          <span className="flex w-full items-center justify-center rounded-[13px] bg-gradient-to-b from-[#E36F02] to-[#FDA85A] px-4 py-3.5 text-[18px] font-semibold text-white shadow-[0px_2px_10.1px_0px_#FC7B0233]">
            {loading ? (
              "Starting checkout..."
            ) : (
              <span className="inline-flex flex-wrap items-center justify-center gap-x-1.5">
                Claim lifetime access —
                <FormattedPrice
                  amount={publicConfig.lifetimeAccessPriceUsd}
                  weight="bold"
                />
              </span>
            )}
          </span>
        </button>

        <p className="mt-5 text-center text-[15px] font-bold uppercase leading-snug text-[#16A34A]">
          100% money-back guarantee
        </p>
        <p className="mt-1 text-center text-[14px] font-medium italic text-[#16A34A]">
          No lead in 30 days? Full refund. No questions asked.
        </p>

        {isGuest ? (
          <p className="mt-5 text-center text-[13px] leading-relaxed text-[#5B6B7C]">
            Pay first. Then walk in with the same email.
          </p>
        ) : null}
      </div>
    </div>
  );
}
