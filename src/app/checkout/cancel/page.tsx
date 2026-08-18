import {
  CancelCheckoutButton,
  PendingDodoRedirect,
} from "@/components/checkout/cancel-checkout-button";
import { FormattedPrice } from "@/components/ui/formatted-price";
import { publicConfig } from "@/lib/config";

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

export default function CheckoutCancelPage() {
  return (
    <div className="relative min-h-screen bg-white [--landing-navy:#112437] [--landing-orange:#FC7B02] [--landing-orange-hover:#E36F02]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(252,123,2,0.12),transparent_55%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-10">
        <div className="rounded-2xl border border-[#8B9AAB] bg-white px-6 py-8 text-center shadow-[0_8px_32px_rgba(17,36,55,0.12)] sm:px-8">
          <PendingDodoRedirect>
            <h1 className="text-balance text-[30px] font-bold leading-[1.05] tracking-tight text-[var(--landing-navy)] sm:text-[38px]">
            Don&apos;t Miss Your Next{" "}
            <span className="inline-block bg-gradient-to-br from-[#D96800] via-[#FC7B02] to-[#FDA85A] bg-clip-text text-[38px] text-transparent drop-shadow-[0_2px_14px_rgba(252,123,2,0.28)] sm:text-[48px]">
              Big Deal.
            </span>
          </h1>
          <p className="mt-5 inline-flex flex-wrap items-center justify-center gap-1.5 text-[18px] font-bold leading-tight text-[#16A34A] sm:text-[22px]">
            <span className="uppercase">Your next deal</span>
            <span aria-hidden>&gt;</span>
            <FormattedPrice
              amount={publicConfig.lifetimeAccessPriceUsd}
              weight="bold"
              className="font-bold text-[#16A34A]"
            />
          </p>
          <p className="mt-2 text-[20px] font-bold italic text-[#16A34A] sm:text-[24px]">
            200X ROI
          </p>
          <CancelCheckoutButton />
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
          </PendingDodoRedirect>
        </div>
      </div>
    </div>
  );
}
