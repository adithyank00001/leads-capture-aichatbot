import { publicConfig } from "@/lib/config";
import { track } from "@/lib/fbpixel";
import { ensureBrowserFbcCookie } from "@/lib/meta/fbc";
import { getMetaPageContentName } from "@/lib/meta/public-pages";

export type BrowserTrackableEvent =
  | "PageView"
  | "ViewContent"
  | "InitiateCheckout"
  | "Contact";

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
 * Forward an event to CAPI only (same-origin /api/meta/events).
 * Used when the browser Pixel event was already queued early with this event_id.
 * Never throws; never blocks the UI.
 */
export type BrowserTrackUserData = {
  email?: string | null;
};

export function forwardCapiEvent(
  eventName: BrowserTrackableEvent,
  eventId: string,
  params: Record<string, unknown> = {},
  eventSourceUrl?: string,
  userData?: BrowserTrackUserData,
): void {
  const trimmedId = eventId.trim();
  if (!trimmedId) {
    return;
  }

  const sourceUrl = eventSourceUrl?.trim() || currentPageUrl();
  const email = userData?.email?.trim().toLowerCase() || null;

  try {
    ensureBrowserFbcCookie();
  } catch {
    // Cookie write must never break tracking.
  }

  try {
    const body = JSON.stringify({
      eventName,
      eventId: trimmedId,
      eventSourceUrl: sourceUrl,
      ...(Object.keys(params).length > 0 ? { customData: params } : {}),
      ...(email ? { email } : {}),
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
}

/**
 * Fire Pixel + CAPI with the same event_id for Meta deduplication.
 * Never throws; never blocks the UI.
 */
export function trackPixelAndCapi(
  eventName: BrowserTrackableEvent,
  params: Record<string, unknown> = {},
  eventSourceUrl?: string,
  userData?: BrowserTrackUserData,
): string {
  const eventId = createEventId();

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

  forwardCapiEvent(eventName, eventId, params, eventSourceUrl, userData);

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

/** Generic ViewContent — prefer store-track helpers for the digital product store. */
export function trackViewContent(
  params: Record<string, unknown> = {},
  eventSourceUrl?: string,
): void {
  trackPixelAndCapi("ViewContent", params, eventSourceUrl);
}

/** WhatsApp CTA click — Pixel + CAPI Contact with shared event_id (dedupe). */
export function trackWhatsAppContact(eventSourceUrl?: string): void {
  trackPixelAndCapi(
    "Contact",
    {
      value: publicConfig.lifetimeAccessPriceUsd,
      currency: "AED",
      content_name: "WhatsApp CTA",
      content_category: "whatsapp",
    },
    eventSourceUrl,
  );
}
