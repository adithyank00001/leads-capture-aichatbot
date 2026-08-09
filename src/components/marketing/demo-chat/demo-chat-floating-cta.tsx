import { CtaButton } from "@/components/marketing/cta-button";

export function DemoChatFloatingCta() {
  return (
    <div className="flex shrink-0 justify-center px-4 pb-2 pt-1">
      <div className="w-full max-w-[240px] rounded-xl border border-[#112437]/10 bg-white px-3 py-2.5 shadow-[0_4px_18px_rgba(17,36,55,0.12)]">
        <CtaButton
          className="w-full"
          size="compact"
          label="Capture More Website Leads"
          showPrice={false}
        />
        <p className="mt-1.5 text-center text-[11px] font-semibold leading-tight text-[#16A34A] sm:text-[12px]">
          Try it risk-free · Pay once, use forever
        </p>
      </div>
    </div>
  );
}
