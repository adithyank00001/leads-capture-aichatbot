import { apiError, apiSuccess } from "@/lib/api-response";
import { handleRouteError } from "@/lib/api/request";
import { getRequestOrigin } from "@/lib/auth/oauth";
import {
  CLIENT_FORWARDABLE_CAPI_EVENTS,
  sendCapiEvent,
  type ClientForwardableCapiEvent,
} from "@/lib/meta/capi";
import { getMetaAttributionFromRequest } from "@/lib/meta/attribution";
import { assertMetaEventsRateLimits } from "@/lib/rate-limit";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type MetaEventsBody = {
  eventName?: unknown;
  eventId?: unknown;
  eventSourceUrl?: unknown;
  customData?: unknown;
};

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
        "Only PageView and InitiateCheckout can be sent from the browser.",
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

    let email: string | null = null;
    try {
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      email = user?.email ?? null;
    } catch {
      email = null;
    }

    const attribution = getMetaAttributionFromRequest(request, {
      eventSourceUrl,
    });

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
