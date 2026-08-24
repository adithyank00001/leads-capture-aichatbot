"use client";

import { cn } from "@/lib/utils";

export type LauncherHintPhase = "idle" | "enter" | "visible" | "exit" | "done";

type ChatLauncherHintProps = {
  text: string;
  onOpen: () => void;
  phase: LauncherHintPhase;
  ariaLabel?: string;
};

export function ChatLauncherHint({
  text,
  onOpen,
  phase,
  ariaLabel,
}: ChatLauncherHintProps) {
  const expanded = phase === "enter" || phase === "visible";
  const isInteractive = expanded;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "absolute bottom-[calc(100%+12px)] right-4 z-10 w-max max-w-[min(210px,calc(100vw-5.5rem))] origin-bottom-right overflow-visible text-left sm:right-6 sm:max-w-[230px]",
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
      <span className="relative block overflow-visible rounded-3xl border border-black/10 bg-[#E2E8EF] px-3.5 py-2 text-[13px] font-semibold leading-snug tracking-tight text-[#112437] shadow-[0_0_0_0.5px_rgba(0,0,0,0.18),0_4px_14px_rgba(17,36,55,0.08)] sm:rounded-full sm:px-4 sm:py-2.5 sm:text-[14px] sm:whitespace-nowrap">
        {text}
        <span
          className="absolute bottom-0 right-3 block size-2.5 translate-x-0.5 translate-y-[48%] rotate-[28deg] border-b border-r border-black/10 bg-[#E2E8EF]"
          aria-hidden
        />
      </span>
    </button>
  );
}
