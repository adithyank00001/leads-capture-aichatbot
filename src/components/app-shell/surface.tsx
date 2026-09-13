import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type SurfaceProps = {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md";
};

const paddingClass = {
  none: "",
  sm: "p-4",
  md: "p-5 md:p-6",
} as const;

/** Clean enterprise panel used across both product dashboards. */
export function Surface({
  children,
  className,
  padding = "md",
}: SurfaceProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/80 bg-card text-card-foreground shadow-sm",
        paddingClass[padding],
        className,
      )}
    >
      {children}
    </div>
  );
}
