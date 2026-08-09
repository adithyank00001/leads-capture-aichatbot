import { DirhamPrice } from "dirham/react";

import { cn } from "@/lib/utils";

type FormattedPriceProps = {
  amount: number;
  className?: string;
  lineThrough?: boolean;
  symbolSize?: number | string;
  weight?: "regular" | "medium" | "semibold" | "bold";
};

export function FormattedPrice({
  amount,
  className,
  lineThrough = false,
  symbolSize = "1em",
  weight = "semibold",
}: FormattedPriceProps) {
  return (
    <DirhamPrice
      amount={amount}
      decimals={0}
      locale="en-AE"
      symbolSize={symbolSize}
      weight={weight}
      className={cn(
        "leading-none",
        lineThrough && "line-through opacity-70",
        className,
      )}
    />
  );
}

type StackedCtaPriceProps = {
  amount: number;
  originalAmount: number;
  className?: string;
};

/** Sale price on top, crossed original tucked underneath — inherits parent text size. */
export function StackedCtaPrice({
  amount,
  originalAmount,
  className,
}: StackedCtaPriceProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 flex-col items-center gap-px leading-none",
        className,
      )}
    >
      <FormattedPrice amount={amount} weight="bold" className="font-bold" />
      <FormattedPrice
        amount={originalAmount}
        lineThrough
        weight="regular"
        className="text-[calc(1em-1px)] font-normal text-white/70"
      />
    </span>
  );
}

/** Sale and original price side by side — for pricing CTA below the label. */
export function InlineCtaPrice({
  amount,
  originalAmount,
  className,
}: StackedCtaPriceProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-2 leading-none",
        className,
      )}
    >
      <FormattedPrice amount={amount} weight="bold" className="font-bold" />
      <FormattedPrice
        amount={originalAmount}
        lineThrough
        weight="regular"
        className="text-[calc(1em-2px)] font-normal text-white/70"
      />
    </span>
  );
}
