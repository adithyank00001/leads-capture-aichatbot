"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

import { FB_PIXEL_ID } from "@/lib/fbpixel";
import { trackPageView } from "@/lib/meta/browser-track";
import { ensureBrowserFbcCookie } from "@/lib/meta/fbc";
import {
  getMetaPageViewKey,
  isPublicMetaPagePath,
} from "@/lib/meta/public-pages";

declare global {
  interface Window {
    __LEADCX_META__?: {
      initialPageViewKey?: string;
      initialPageViewEventId?: string;
      pixelBootstrapped?: boolean;
    };
  }
}

/**
 * SPA / client navigations only.
 * First landing PageView is fired via beforeInteractive bootstrap
 * (Pixel + CAPI with the same event_id). Do not double-fire that load.
 */
function PixelTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isPublicMetaPagePath(pathname)) {
      return;
    }
    try {
      ensureBrowserFbcCookie();
    } catch {
      // ignore
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!isPublicMetaPagePath(pathname)) {
      return;
    }

    const key = getMetaPageViewKey(pathname, searchParams);
    if (lastKeyRef.current === key) {
      return;
    }

    const boot = window.__LEADCX_META__;
    if (boot?.pixelBootstrapped && boot.initialPageViewKey === key) {
      // Head bootstrap already sent Pixel + CAPI PageView for this URL.
      lastKeyRef.current = key;
      return;
    }

    if (typeof window.fbq !== "function") {
      // Pixel script still loading — retry briefly so SPA views are not skipped.
      const intervalId = window.setInterval(() => {
        if (typeof window.fbq !== "function") {
          return;
        }
        window.clearInterval(intervalId);
        if (lastKeyRef.current === key) {
          return;
        }
        lastKeyRef.current = key;
        trackPageView();
      }, 50);
      const timeoutId = window.setTimeout(() => {
        window.clearInterval(intervalId);
      }, 5000);
      return () => {
        window.clearInterval(intervalId);
        window.clearTimeout(timeoutId);
      };
    }

    lastKeyRef.current = key;
    trackPageView();
  }, [pathname, searchParams]);

  return null;
}

/** Client helper for SPA PageViews after the early head bootstrap. */
export function MetaPixel() {
  const pathname = usePathname();

  if (!FB_PIXEL_ID || pathname.startsWith("/embed")) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <PixelTracker />
    </Suspense>
  );
}
