import { publicConfig } from "@/lib/config";
import { track } from "@/lib/fbpixel";

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
  trackPixelAndCapi("PageView", {}, eventSourceUrl);
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
