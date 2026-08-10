import { CtaButton } from "@/components/marketing/cta-button";
import { resolveMarketingCta } from "@/lib/marketing/cta";

export function StickyDesktopCta({
  hasLifetimeAccess = false,
}: {
  hasLifetimeAccess?: boolean;
}) {
  const marketingCta = resolveMarketingCta(hasLifetimeAccess);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-6 z-[125] hidden justify-center px-4 lg:flex"
      aria-hidden={false}
    >
      <div className="pointer-events-auto w-full max-w-[720px] rounded-2xl border border-[#112437]/10 bg-white px-5 py-3.5 shadow-[0_8px_32px_rgba(17,36,55,0.14)]">
        {!hasLifetimeAccess ? (
          <p className="mb-2 text-center text-[12px] font-bold uppercase italic tracking-wide text-[#E36F02]">
            LIMITED TIME · SAVE 80% TODAY
          </p>
        ) : null}
        <CtaButton className="w-full" {...marketingCta} />
        {!hasLifetimeAccess ? (
          <p className="mt-2 text-center text-[12px] font-semibold uppercase leading-none tracking-tight text-[#16A34A]">
            Try it risk-free · 100% money-back guarantee
          </p>
        ) : null}
      </div>
    </div>
  );
}
