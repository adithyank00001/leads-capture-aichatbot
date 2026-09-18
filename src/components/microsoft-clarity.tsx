"use client";

import Clarity from "@microsoft/clarity";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const CLARITY_PROJECT_ID =
  process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID?.trim() || "";

/**
 * Microsoft Clarity — loaded late on purpose so Meta Pixel/CAPI stay first
 * and the store product page stays snappy.
 */
export function MicrosoftClarity() {
  const pathname = usePathname();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (
      !CLARITY_PROJECT_ID ||
      pathname.startsWith("/embed") ||
      initializedRef.current ||
      typeof window === "undefined"
    ) {
      return;
    }

    let idleId: number | undefined;
    let timeoutId: number | undefined;
    let cancelled = false;

    const start = () => {
      if (cancelled || initializedRef.current) return;
      try {
        Clarity.init(CLARITY_PROJECT_ID);
        initializedRef.current = true;
      } catch {
        // Clarity must never break the page.
      }
    };

    const schedule = () => {
      if (cancelled || initializedRef.current) return;
      const win = window as Window & {
        requestIdleCallback?: (
          cb: IdleRequestCallback,
          opts?: IdleRequestOptions,
        ) => number;
        cancelIdleCallback?: (id: number) => void;
      };

      if (typeof win.requestIdleCallback === "function") {
        idleId = win.requestIdleCallback(() => start(), { timeout: 3500 });
      } else {
        timeoutId = window.setTimeout(start, 3500);
      }
    };

    if (document.readyState === "complete") {
      // Page already loaded — still wait a bit so Meta fires first.
      timeoutId = window.setTimeout(schedule, 1500);
    } else {
      const onLoad = () => {
        timeoutId = window.setTimeout(schedule, 1500);
      };
      window.addEventListener("load", onLoad, { once: true });
      return () => {
        cancelled = true;
        window.removeEventListener("load", onLoad);
        if (idleId != null && typeof window.cancelIdleCallback === "function") {
          window.cancelIdleCallback(idleId);
        }
        if (timeoutId != null) window.clearTimeout(timeoutId);
      };
    }

    return () => {
      cancelled = true;
      if (idleId != null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId != null) window.clearTimeout(timeoutId);
    };
  }, [pathname]);

  return null;
}
