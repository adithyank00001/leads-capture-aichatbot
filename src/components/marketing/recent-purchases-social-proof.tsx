"use client";

import { getHourlyPurchaseCount } from "@/lib/marketing/hourly-purchase-count";
import { cn } from "@/lib/utils";

export function RecentPurchasesSocialProof({
  className,
}: {
  className?: string;
}) {
  const count = getHourlyPurchaseCount(new Date());

  return (
    <p
      className={cn(
        "text-center text-[15px] font-normal whitespace-nowrap text-[#5A6B7D]",
        className,
      )}
    >
      <span
        className="font-bold text-[var(--landing-orange)]"
        suppressHydrationWarning
      >
        {count}
      </span>{" "}
      real estate pros bought in the{" "}
      <span className="font-bold text-[var(--landing-orange)]">last 24h</span>
    </p>
  );
}
