import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

export function ProductStars({ rating }: { rating: number }) {
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i + 1 <= Math.round(rating);
        return (
          <Star
            key={i}
            className={cn(
              "size-3.5",
              filled
                ? "fill-[var(--store-ink)] text-[var(--store-ink)]"
                : "text-[var(--store-line)]",
            )}
          />
        );
      })}
    </div>
  );
}
