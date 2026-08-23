"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";

import { FB_PIXEL_ID } from "@/lib/fbpixel";
import { trackPageView } from "@/lib/meta/browser-track";
import { isPublicMetaPagePath } from "@/lib/meta/public-pages";

function PixelTracker({ pixelReady }: { pixelReady: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pixelReady || !isPublicMetaPagePath(pathname)) {
      return;
    }

    const key = `${pathname}?${searchParams.toString()}`;
    if (lastKeyRef.current === key) {
      return;
    }

    lastKeyRef.current = key;
    trackPageView();
  }, [pathname, searchParams, pixelReady]);

  return null;
}

export function MetaPixel() {
  const pathname = usePathname();
  const [pixelReady, setPixelReady] = useState(false);

  const markReady = useCallback(() => {
    setPixelReady(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (typeof window.fbq === "function") {
      setPixelReady(true);
      return;
    }

    const intervalId = window.setInterval(() => {
      if (typeof window.fbq === "function") {
        setPixelReady(true);
        window.clearInterval(intervalId);
      }
    }, 50);

    const timeoutId = window.setTimeout(() => {
      window.clearInterval(intervalId);
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, []);

  if (!FB_PIXEL_ID || pathname.startsWith("/embed")) {
    return null;
  }

  return (
    <>
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        onLoad={markReady}
      >
        {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${FB_PIXEL_ID}');`}
      </Script>
      <Suspense fallback={null}>
        <PixelTracker pixelReady={pixelReady} />
      </Suspense>
    </>
  );
}
