"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { publicConfig } from "@/lib/config";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

const PIXEL_SKIP_PREFIXES = ["/dashboard", "/embed", "/auth"];

function shouldTrackPath(pathname: string) {
  return !PIXEL_SKIP_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function MetaPixelPageView() {
  const pathname = usePathname();
  const pixelId = publicConfig.metaPixelId;
  const isFirstPage = useRef(true);

  useEffect(() => {
    if (!pixelId || !shouldTrackPath(pathname)) {
      return;
    }

    if (isFirstPage.current) {
      isFirstPage.current = false;
      return;
    }

    window.fbq?.("track", "PageView");
  }, [pathname, pixelId]);

  return null;
}
