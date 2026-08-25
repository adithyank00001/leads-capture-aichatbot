import { publicConfig } from "@/lib/config";
import { track } from "@/lib/fbpixel";
import { ensureBrowserFbcCookie } from "@/lib/meta/fbc";
import { getMetaPageContentName } from "@/lib/meta/public-pages";

export type BrowserTrackableEvent = "PageView" | "InitiateCheckout";

function createEventId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function currentPageUrl(): string {
  if (typeof window === "undefined") {
    return publicConfig.appUrl;
  }

  return window.location.href;
}

function resolvePathnameForPageView(eventSourceUrl?: string): string {
  const trimmed = eventSourceUrl?.trim();
  if (trimmed) {
    try {
      if (trimmed.startsWith("/")) {
        return trimmed.split("?")[0]?.split("#")[0] || "/";
      }
      return new URL(trimmed).pathname || "/";
    } catch {
      // fall through to window
    }
  }

  if (typeof window !== "undefined") {
    return window.location.pathname || "/";
  }

  return "/";
}

/**
 * Fire Pixel + CAPI with the same event_id for Meta deduplication.
 * Never throws; never blocks the UI.
 */
export function trackPixelAndCapi(
  eventName: BrowserTrackableEvent,
  params: Record<string, unknown> = {},
  eventSourceUrl?: string,
): string {
  const eventId = createEventId();
  const sourceUrl = eventSourceUrl?.trim() || currentPageUrl();

  // Persist fbclid → _fbc before Pixel + CAPI so checkout/Purchase still match later.
  try {
    ensureBrowserFbcCookie();
  } catch {
    // Cookie write must never break tracking.
  }

  try {
    track(eventName, params, { eventID: eventId });
  } catch {
    // Pixel must never break the page.
  }

  try {
    const body = JSON.stringify({
      eventName,
      eventId,
      eventSourceUrl: sourceUrl,
      ...(Object.keys(params).length > 0 ? { customData: params } : {}),
    });

    void fetch("/api/meta/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
      credentials: "same-origin",
    }).catch(() => {
      // CAPI forward must never break the page.
    });
  } catch {
    // ignore
  }

  return eventId;
}

export function trackPageView(eventSourceUrl?: string): void {
  const contentName = getMetaPageContentName(
    resolvePathnameForPageView(eventSourceUrl),
  );
  const params = contentName ? { content_name: contentName } : {};
  trackPixelAndCapi("PageView", params, eventSourceUrl);
}

export function trackInitiateCheckout(eventSourceUrl?: string): void {
  trackPixelAndCapi(
    "InitiateCheckout",
    {
      value: publicConfig.lifetimeAccessPriceUsd,
      currency: "USD",
      num_items: 1,
    },
    eventSourceUrl,
  );
}
