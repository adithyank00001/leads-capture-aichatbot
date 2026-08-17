"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
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

export function MetaPixel() {
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

  if (!pixelId || !shouldTrackPath(pathname)) {
    return null;
  }

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${pixelId}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
