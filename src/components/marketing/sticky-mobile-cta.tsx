import { CtaButton } from "@/components/marketing/cta-button";

export function StickyMobileCta() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4 lg:hidden">
      <div className="mx-auto max-w-lg rounded-[19px] border border-[#112437]/12 bg-white px-1.5 py-3 shadow-[0_-4px_20px_rgba(17,36,55,0.1)] sm:px-3">
        <p className="mb-2 text-center text-[14px] font-bold uppercase italic tracking-wide text-[#E36F02] sm:text-[12px]">
          LIMITED TIME · SAVE 80% TODAY
        </p>
        <CtaButton className="w-full" />
        <p className="mt-2 w-full text-center text-[13px] font-semibold uppercase leading-none tracking-tight text-[#16A34A] whitespace-nowrap">
          Try it risk-free · 100% money-back guarantee
        </p>
      </div>
    </div>
  );
}
