import { apiError, apiSuccess } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api/request";
import { getRequestOrigin } from "@/lib/auth/oauth";
import {
  CLIENT_FORWARDABLE_CAPI_EVENTS,
  sendCapiEvent,
  type ClientForwardableCapiEvent,
} from "@/lib/meta/capi";
import { getMetaAttributionFromRequest } from "@/lib/meta/attribution";
import { isValidFbc, isValidFbp } from "@/lib/meta/fbc";
import { assertMetaEventsRateLimits } from "@/lib/rate-limit";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type MetaEventsBody = {
  eventName?: unknown;
  eventId?: unknown;
  eventSourceUrl?: unknown;
  customData?: unknown;
  /** Guest checkout email (store). Optional — improves CAPI match quality. */
  email?: unknown;
  /** Browser _fbp / _fbc — preferred when Cookie header is incomplete. */
  fbp?: unknown;
  fbc?: unknown;
};

function parseGuestEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const email = raw.trim().toLowerCase();
  if (!email || email.length > 254) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

function parseClientFbp(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  return isValidFbp(trimmed) ? trimmed : undefined;
}

function parseClientFbc(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  return isValidFbc(trimmed) ? trimmed : undefined;
}

function isClientForwardableEvent(
  value: string,
): value is ClientForwardableCapiEvent {
  return (CLIENT_FORWARDABLE_CAPI_EVENTS as readonly string[]).includes(value);
}

function resolveEventSourceUrl(
  raw: unknown,
  request: Request,
): string | null {
  if (typeof raw !== "string") {
    return null;
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  const origin = getRequestOrigin(request).replace(/\/+$/, "");

  try {
    if (trimmed.startsWith("/")) {
      if (trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
        return null;
      }
      return `${origin}${trimmed}`;
    }

    const url = new URL(trimmed);
    const allowed = new URL(origin);

    if (url.origin !== allowed.origin) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    await assertMetaEventsRateLimits(request);

    const body = (await request.json()) as MetaEventsBody;
    const eventName =
      typeof body.eventName === "string" ? body.eventName.trim() : "";
    const eventId =
      typeof body.eventId === "string" ? body.eventId.trim() : "";

    if (!isClientForwardableEvent(eventName)) {
      return apiError(
        "INVALID_EVENT",
        "Only PageView, ViewContent, InitiateCheckout, and Contact can be sent from the browser.",
        400,
      );
    }

    if (!eventId || eventId.length > 128) {
      return apiError("INVALID_EVENT_ID", "A valid eventId is required.", 400);
    }

    const eventSourceUrl = resolveEventSourceUrl(body.eventSourceUrl, request);
    if (!eventSourceUrl) {
      return apiError(
        "INVALID_EVENT_SOURCE_URL",
        "eventSourceUrl must be a same-origin URL.",
        400,
      );
    }

    let customData: Record<string, unknown> | undefined;
    if (
      body.customData &&
      typeof body.customData === "object" &&
      !Array.isArray(body.customData)
    ) {
      customData = body.customData as Record<string, unknown>;
    }

    const guestEmail = parseGuestEmail(body.email);

    let authEmail: string | null = null;
    try {
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      authEmail = user?.email ?? null;
    } catch {
      authEmail = null;
    }

    // Prefer guest checkout email (store) when present — better Purchase match later.
    const email = guestEmail ?? authEmail;

    const fromCookies = getMetaAttributionFromRequest(request, {
      eventSourceUrl,
    });
    const clientFbp = parseClientFbp(body.fbp);
    const clientFbc = parseClientFbc(body.fbc);

    // Prefer explicit browser click ids (more reliable than Cookie header alone).
    const attribution = {
      fbp: clientFbp ?? fromCookies.fbp,
      fbc: clientFbc ?? fromCookies.fbc,
      clientIp: fromCookies.clientIp,
      userAgent: fromCookies.userAgent,
    };

    await sendCapiEvent({
      eventName,
      eventId,
      eventSourceUrl,
      email,
      attribution,
      customData,
    });

    return apiSuccess({ accepted: true });
  } catch (error) {
    const routeError = handleRouteError(error);
    return apiError(routeError.code, routeError.message, routeError.status);
  }
}
