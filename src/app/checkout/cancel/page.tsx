import Link from "next/link";

import { BrandLogo } from "@/components/marketing/brand-logo";

export default function CheckoutCancelPage() {
  return (
    <div className="relative min-h-screen bg-white [--landing-navy:#112437] [--landing-orange:#FC7B02] [--landing-orange-hover:#E36F02]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(252,123,2,0.12),transparent_55%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-10">
        <div className="mb-8 flex justify-center">
          <BrandLogo size="sm" href="/" />
        </div>
        <div className="rounded-2xl border border-[#8B9AAB] bg-white px-6 py-8 text-center shadow-[0_8px_32px_rgba(17,36,55,0.12)] sm:px-8">
          <h1 className="text-balance text-[28px] font-bold leading-tight text-[var(--landing-navy)]">
            The leads are still waiting.
          </h1>
          <p className="mt-3 text-[16px] font-medium leading-relaxed text-[#5B6B7C]">
            Nothing was charged. One click is all that stands between you and a
            lifetime of captured leads.
          </p>
          <Link
            href="/"
            className="mt-7 inline-flex w-full items-center justify-center rounded-[13px] bg-gradient-to-b from-[#E36F02] to-[#FDA85A] px-4 py-3.5 text-[17px] font-semibold text-white shadow-[0px_2px_10.1px_0px_#FC7B0233] transition-transform hover:scale-[1.03]"
          >
            Go get them
          </Link>
        </div>
      </div>
    </div>
  );
}
