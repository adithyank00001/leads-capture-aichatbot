"use client";

import { cn } from "@/lib/utils";
import { pickReadableTextColor } from "@/lib/widget/contrast";
import {
  WIDGET_DEFAULT_LAUNCHER_HINT_COLOR,
  WIDGET_DEFAULT_LAUNCHER_HINT_TEXT,
} from "@/lib/widget/defaults";

export type LauncherHintPhase = "idle" | "enter" | "visible" | "exit" | "done";

type ChatLauncherHintProps = {
  text?: string;
  backgroundColor?: string;
  onOpen: () => void;
  phase: LauncherHintPhase;
  ariaLabel?: string;
  /** Force large size (used by embed when the parent page is desktop). */
  large?: boolean;
};

export function ChatLauncherHint({
  text = WIDGET_DEFAULT_LAUNCHER_HINT_TEXT,
  backgroundColor = WIDGET_DEFAULT_LAUNCHER_HINT_COLOR,
  onOpen,
  phase,
  ariaLabel,
  large = false,
}: ChatLauncherHintProps) {
  const expanded = phase === "enter" || phase === "visible";
  const isInteractive = expanded;
  const textColor = pickReadableTextColor(backgroundColor);

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "absolute bottom-[calc(100%+12px)] z-10 w-max origin-bottom-right overflow-visible text-left",
        // Sit further left of the button so it is not stuck to the right edge
        "right-10 sm:right-12 lg:right-14",
        large && "right-14",
        "max-w-[min(210px,calc(100vw-5.5rem))] sm:max-w-[230px]",
        "lg:max-w-[min(280px,calc(100vw-6rem))]",
        large && "max-w-[min(280px,calc(100vw-6rem))]",
        "transition-[transform,opacity] will-change-transform",
        expanded
          ? "pointer-events-auto translate-x-0 translate-y-0 scale-100 opacity-100"
          : "pointer-events-none translate-x-3 translate-y-4 scale-[0.18] opacity-0",
        phase === "enter" &&
          "duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
        phase === "visible" && "duration-300 ease-out",
        phase === "exit" && "duration-350 ease-in",
        (phase === "idle" || phase === "done") && "duration-0",
      )}
      aria-hidden={!isInteractive}
      tabIndex={isInteractive ? 0 : -1}
      aria-label={ariaLabel ?? text}
    >
      <span
        className={cn(
          "relative z-10 block overflow-visible rounded-3xl border border-black/10",
          "px-3.5 py-2 text-[13px] font-semibold leading-snug tracking-tight",
          "shadow-[0_0_0_0.5px_rgba(0,0,0,0.18),0_4px_14px_rgba(17,36,55,0.08)]",
          "sm:rounded-full sm:px-4 sm:py-2.5 sm:text-[14px] sm:whitespace-nowrap",
          "lg:px-5 lg:py-3 lg:text-[16px]",
          large && "rounded-full px-5 py-3 text-[16px] whitespace-nowrap",
        )}
        style={{
          backgroundColor,
          color: textColor,
        }}
      >
        {text}
      </span>
    </button>
  );
}
