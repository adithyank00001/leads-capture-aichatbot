"use client";

import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const WRAPPER_CLASS =
  "hover:scale-[1.04] transition-all duration-200 will-change-transform rounded-[14px] p-[1px] bg-gradient-to-b from-[#FFB06A] to-[#FF8A3D] hover:from-[#E8883A] hover:to-[#D46A1C] w-full";

const BUTTON_CLASS =
  "rounded-[13px] font-medium transition-all will-change-transform flex items-center justify-center gap-2 bg-gradient-to-b from-[#E36F02] to-[#FC7B02] text-white shadow-[0px_2px_10.1px_0px_#FC7B0233] hover:shadow-[0px_2px_10.1px_0px_#FC7B0244] relative overflow-hidden z-10 before:absolute before:inset-0 before:bg-gradient-to-b before:from-[#D45E00] before:to-[#F07310] before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-200 before:z-0 before:content-[''] text-[16px] py-[11.7px] px-[22px] w-full disabled:opacity-80 disabled:cursor-wait";

type StoreBuyCtaButtonProps = {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  busy?: boolean;
  /** Extra classes on the inner button (e.g. min-height for sticky). */
  buttonClassName?: string;
};

/** Shared orange store buy CTA — same look as sticky / main buy. */
export function StoreBuyCtaButton({
  children,
  onClick,
  disabled = false,
  busy = false,
  buttonClassName,
}: StoreBuyCtaButtonProps) {
  return (
    <div className={WRAPPER_CLASS}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-busy={busy}
        className={cn(BUTTON_CLASS, buttonClassName)}
      >
        <span className="relative z-10 flex items-center gap-2">
          {children}
          {!busy ? <ChevronRight className="size-4" /> : null}
        </span>
      </button>
    </div>
  );
}

/** Final CTA: same button UI, triggers the real #buy checkout button. */
export function StoreFinalCtaBuyButton({ label }: { label: string }) {
  return (
    <StoreBuyCtaButton
      buttonClassName="min-h-[2.85rem]"
      onClick={() => {
        const buyButton = document.querySelector("#buy button");
        if (buyButton instanceof HTMLButtonElement) {
          buyButton.click();
          return;
        }
        document.getElementById("buy")?.scrollIntoView({ behavior: "smooth" });
      }}
    >
      {label}
    </StoreBuyCtaButton>
  );
}
