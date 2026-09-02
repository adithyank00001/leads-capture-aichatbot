import { CtaButton } from "@/components/marketing/cta-button";
import { resolveMarketingCta } from "@/lib/marketing/cta";

export function StickyMobileCta({
  hasLifetimeAccess = false,
}: {
  hasLifetimeAccess?: boolean;
}) {
  const marketingCta = resolveMarketingCta(hasLifetimeAccess);

  return (
    <div
      id="sticky-mobile-cta"
      className="fixed inset-x-0 bottom-0 z-[120] border-t border-[#112437]/12 bg-white px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-2px_12px_rgba(17,36,55,0.08)] lg:hidden"
    >
      {!hasLifetimeAccess ? (
        <p className="mb-2 text-center text-[14px] font-bold uppercase italic tracking-wide text-[#E36F02] sm:text-[12px]">
          LIMITED TIME · SAVE 80% TODAY
        </p>
      ) : null}
      <CtaButton className="w-full" buttonClassName="text-[18px] sm:text-[22px]" {...marketingCta} />
      {!hasLifetimeAccess ? (
        <p className="mt-2 w-full text-center text-[13px] font-semibold uppercase leading-none tracking-tight text-[#16A34A] whitespace-nowrap">
          Try it risk-free · 100% money-back guarantee
        </p>
      ) : null}
    </div>
  );
}
