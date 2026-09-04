import { FormattedPrice } from "@/components/ui/formatted-price";
import { publicConfig } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * One-line note under landing CTAs.
 * Not used on sticky mobile/desktop bars.
 */
export function CtaSubtext({
  className,
  onDark = false,
  compact = false,
}: {
  className?: string;
  onDark?: boolean;
  compact?: boolean;
}) {
  return (
    <p
      className={cn(
        "mt-1.5 flex w-full max-w-full items-center justify-center gap-1.5 whitespace-nowrap font-medium leading-none tracking-tight",
        // Readable small type — not tiny
        compact ? "text-[12px] sm:text-[13px]" : "text-[13px] sm:text-[14px]",
        onDark ? "text-white/80" : "text-[var(--landing-navy)]/75",
        className,
      )}
    >
      <span>Instant activation via WhatsApp</span>
      <span aria-hidden className="opacity-55">
        •
      </span>
      <span className="inline-flex items-center gap-1">
        One-time
        <FormattedPrice
          amount={publicConfig.lifetimeAccessPriceUsd}
          weight="semibold"
          symbolSize="0.95em"
          className={cn(
            "font-semibold",
            onDark ? "text-white/90" : "text-[var(--landing-navy)]/85",
          )}
        />
      </span>
    </p>
  );
}
