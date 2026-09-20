"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

import { FB_PIXEL_ID } from "@/lib/fbpixel";
import { forwardCapiEvent, trackPageView } from "@/lib/meta/browser-track";
import { ensureBrowserFbcCookie } from "@/lib/meta/fbc";
import {
  getMetaPageContentName,
  getMetaPageViewKey,
  isPublicMetaPagePath,
} from "@/lib/meta/public-pages";

declare global {
  interface Window {
    __LEADCX_META__?: {
      initialPageViewKey?: string;
      initialPageViewEventId?: string;
      pixelBootstrapped?: boolean;
      pixelPageViewQueued?: boolean;
      capiPageViewSent?: boolean;
    };
  }
}

/**
 * SPA / client navigations + deferred CAPI for the first landing PageView.
 * Head bootstrap queues Pixel PageView early (no Facebook network yet).
 * This component loads fbevents.js after the page is usable, then mirrors CAPI.
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
      // Head bootstrap already queued Pixel PageView for this URL — mirror CAPI once.
      lastKeyRef.current = key;
      if (!boot.capiPageViewSent && boot.initialPageViewEventId) {
        boot.capiPageViewSent = true;
        const contentName = getMetaPageContentName(pathname);
        forwardCapiEvent(
          "PageView",
          boot.initialPageViewEventId,
          contentName ? { content_name: contentName } : {},
        );
      }
      return;
    }

    if (typeof window.fbq !== "function") {
      // Pixel stub / script still loading — retry briefly so SPA views are not skipped.
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

/** Client helper: load Pixel script after paint; track SPA PageViews. */
export function MetaPixel() {
  const pathname = usePathname();

  if (!FB_PIXEL_ID || pathname.startsWith("/embed")) {
    return null;
  }

  return (
    <>
      <Script
        id="meta-fbevents"
        src="https://connect.facebook.net/en_US/fbevents.js"
        strategy="afterInteractive"
      />
      <Suspense fallback={null}>
        <PixelTracker />
      </Suspense>
    </>
  );
}
