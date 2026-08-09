"use client";

import { useEffect, useState } from "react";

import { CtaButton } from "@/components/marketing/cta-button";
import { cn } from "@/lib/utils";

export function StickyDesktopCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const heroCta = document.getElementById("landing-hero-cta");
    const pricing = document.getElementById("landing-pricing");

    if (!heroCta || !pricing) {
      return;
    }

    let heroVisible = true;
    let pricingVisible = false;

    const update = () => {
      setVisible(!heroVisible && !pricingVisible);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target === heroCta) {
            heroVisible = entry.isIntersecting;
          }
          if (entry.target === pricing) {
            pricingVisible = entry.isIntersecting;
          }
        }
        update();
      },
      { threshold: 0.15 },
    );

    observer.observe(heroCta);
    observer.observe(pricing);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-6 z-40 hidden justify-center px-4 opacity-0 transition-all duration-300 lg:flex",
        visible && "pointer-events-auto translate-y-0 opacity-100",
        !visible && "translate-y-2",
      )}
      aria-hidden={!visible}
    >
      <div className="w-full max-w-[720px] rounded-2xl border border-[#112437]/10 bg-white px-5 py-3.5 shadow-[0_8px_32px_rgba(17,36,55,0.14)]">
        <p className="mb-2 text-center text-[12px] font-bold uppercase italic tracking-wide text-[#E36F02]">
          LIMITED TIME · SAVE 80% TODAY
        </p>
        <CtaButton className="w-full" />
        <p className="mt-2 text-center text-[12px] font-semibold uppercase leading-none tracking-tight text-[#16A34A]">
          Try it risk-free · 100% money-back guarantee
        </p>
      </div>
    </div>
  );
}
