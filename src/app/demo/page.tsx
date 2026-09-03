import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";

import { BrandLogo } from "@/components/marketing/brand-logo";
import {
  DemoChatSection,
  DemoTryButton,
} from "@/components/marketing/demo-chat/demo-chat-section";
import { isPrivateDemoPageEnabled } from "@/lib/demo/config";
import { getHasLifetimeAccessForMarketing } from "@/lib/marketing/access";

export const metadata: Metadata = {
  title: "Demo",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

const demoHighlights = [
  "No typing needed · No signup",
  "Pre-written message — just tap to send",
  "Sample details already filled in",
] as const;

export default async function PrivateDemoPage() {
  if (!isPrivateDemoPageEnabled) {
    notFound();
  }

  const hasLifetimeAccess = await getHasLifetimeAccessForMarketing();

  return (
    <div className="min-h-svh bg-white [--landing-navy:#112437] [--landing-orange:#FC7B02]">
      <header className="px-4 py-4 sm:px-6">
        <BrandLogo size="xs" href="/" />
      </header>

      <section id="landing-demo" className="relative z-[90] bg-white">
        <div className="mx-auto max-w-6xl px-4 pt-6 pb-24 sm:px-6 sm:pt-10">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-balance text-[28px] font-bold uppercase tracking-tight text-[var(--landing-navy)] sm:text-[31px]">
              See It in Action
            </h1>
            <DemoTryButton />
            <ul className="mx-auto mt-4 flex w-full max-w-xl flex-col items-start gap-2 text-left sm:mt-5 sm:gap-2.5">
              {demoHighlights.map((point) => (
                <li
                  key={point}
                  className="flex w-full items-start gap-2.5 text-left sm:gap-3"
                >
                  <Check className="mt-0.5 size-5 shrink-0 stroke-[2.5] text-[#16A34A]" />
                  <span className="min-w-0 flex-1 text-left text-[17px] font-medium leading-relaxed text-[var(--landing-navy)] sm:text-[19px]">
                    {point}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mx-auto mt-8 max-w-2xl sm:mt-10">
            <DemoChatSection hasLifetimeAccess={hasLifetimeAccess} />
          </div>
        </div>
      </section>
    </div>
  );
}
