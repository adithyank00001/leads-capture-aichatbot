"use client";

import { useState, type MouseEvent } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import {
  InlineCtaPrice,
  StackedCtaPrice,
} from "@/components/ui/formatted-price";
import { startLandingCheckout } from "@/lib/billing/start-landing-checkout";
import { publicConfig } from "@/lib/config";
import { cn } from "@/lib/utils";

function DiscountBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-[#FFF7ED] px-3.5 py-1 text-[13px] font-bold uppercase italic tracking-wide text-[#E36F02] ring-1 ring-[#FC7B02]/35 sm:text-[14px]",
        className,
      )}
    >
      LIMITED TIME · SAVE 80% TODAY
    </span>
  );
}

export function CtaButton({
  className,
  buttonClassName,
  showDiscountBadge = false,
  size = "default",
  priceBelow = false,
  variant = "primary",
  label = "Get Lifetime Access",
  href = "/checkout",
  showPrice = true,
  startCheckout = false,
}: {
  className?: string;
  buttonClassName?: string;
  showDiscountBadge?: boolean;
  size?: "default" | "large" | "compact";
  /** Stack prices on a horizontal row under the label (pricing section). */
  priceBelow?: boolean;
  variant?: "primary" | "secondary";
  label?: string;
  href?: string;
  showPrice?: boolean;
  startCheckout?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const isLarge = size === "large";
  const isCompact = size === "compact";
  const isSecondary = variant === "secondary";

  const prices = priceBelow ? (
    <InlineCtaPrice
      amount={publicConfig.lifetimeAccessPriceUsd}
      originalAmount={publicConfig.lifetimeAccessOriginalPrice}
    />
  ) : (
    <StackedCtaPrice
      amount={publicConfig.lifetimeAccessPriceUsd}
      originalAmount={publicConfig.lifetimeAccessOriginalPrice}
    />
  );

  async function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!startCheckout) {
      return;
    }

    event.preventDefault();

    if (loading) {
      return;
    }

    setLoading(true);

    try {
      await startLandingCheckout();
    } finally {
      setLoading(false);
    }
  }

  const clickableClassName = cn(
    "relative z-10 flex w-full items-center justify-center gap-2 overflow-hidden font-medium text-white transition-all will-change-transform before:absolute before:inset-0 before:z-0 before:bg-gradient-to-b before:opacity-0 before:transition-opacity before:duration-200",
    isSecondary
      ? "bg-gradient-to-b from-[#112437] to-[#1a334d] shadow-[0px_2px_10.1px_0px_#11243733] before:from-[#0d1c2b] before:to-[#1a334d] hover:shadow-[0px_2px_10.1px_0px_#11243744] hover:before:opacity-100"
      : "bg-gradient-to-b from-[#E36F02] to-[#FDA85A] shadow-[0px_2px_10.1px_0px_#FC7B0233] before:from-[#D96800] before:to-[#FC7B02] hover:shadow-[0px_2px_10.1px_0px_#FC7B0244] hover:before:opacity-100",
    isLarge
      ? "rounded-[15px] px-5 py-3.5 text-[18px] sm:px-7 sm:text-[20px]"
      : isCompact
        ? "rounded-[13px] px-3 py-2 text-[13px]"
        : "rounded-[13px] px-4 py-2.5 text-[17px] sm:px-5 sm:text-[19px]",
    loading && "pointer-events-none opacity-90",
    buttonClassName,
  );

  const labelContent = (
    <span
      className={cn(
        "relative z-10 inline-flex max-w-full items-center justify-center",
        priceBelow ? "flex-col gap-1" : isLarge ? "gap-2.5" : "gap-2",
      )}
    >
      {showPrice ? (
        <>
          <span className="inline-flex min-w-0 items-center gap-2">
            <span className="whitespace-nowrap">{label}</span>
            {priceBelow ? (
              <ChevronRight
                className={cn("shrink-0", isLarge ? "size-6" : "size-5")}
              />
            ) : null}
          </span>
          {priceBelow ? prices : null}
          {!priceBelow ? (
            <>
              {prices}
              <ChevronRight
                className={cn(
                  "shrink-0",
                  isLarge ? "size-6" : isCompact ? "size-4" : "size-5",
                )}
              />
            </>
          ) : null}
        </>
      ) : (
        <>
          <span className="min-w-0 text-center leading-snug text-balance">
            {label}
          </span>
          <ChevronRight
            className={cn(
              "shrink-0",
              isLarge ? "size-6" : isCompact ? "size-4" : "size-5",
            )}
          />
        </>
      )}
    </span>
  );

  const clickable = startCheckout ? (
    <a
      href="/checkout"
      className={clickableClassName}
      onClick={handleClick}
      aria-busy={loading}
      aria-disabled={loading}
    >
      {loading ? (
        <span className="relative z-10 whitespace-nowrap">
          Starting checkout...
        </span>
      ) : (
        labelContent
      )}
    </a>
  ) : (
    <Link href={href} className={clickableClassName}>
      {labelContent}
    </Link>
  );

  const button = (
    <div
      className={cn(
        "w-fit rounded-[14px] p-[1px] transition-all duration-200 will-change-transform hover:scale-[1.04]",
        isSecondary
          ? "bg-gradient-to-b from-[#1a334d] to-[#112437] hover:from-[#112437] hover:to-[#0d1c2b]"
          : "bg-gradient-to-b from-[#FDA85A] to-[#FC7B02] hover:from-[#FC7B02] hover:to-[#E36F02]",
        isLarge && "rounded-[16px]",
        loading && "hover:scale-100",
        className,
      )}
    >
      {clickable}
    </div>
  );

  if (!showDiscountBadge) {
    return button;
  }

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <DiscountBadge />
      {button}
    </div>
  );
}
