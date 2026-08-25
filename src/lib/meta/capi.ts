import "server-only";

import { publicConfig } from "@/lib/config";
import { serverEnv } from "@/lib/env.server";
import { FB_PIXEL_ID } from "@/lib/fbpixel";
import {
  getMetaAttributionFromRequest,
  metaAttributionFromMetadata,
  type MetaAttribution,
} from "@/lib/meta/attribution";
import {
  buildHashedCustomerUserData,
  metaCustomerInfoFromDodo,
  type MetaBillingAddress,
  type MetaCustomerInfo,
} from "@/lib/meta/user-data";

const GRAPH_API_VERSION = "v22.0";

export const CLIENT_FORWARDABLE_CAPI_EVENTS = [
  "PageView",
  "InitiateCheckout",
] as const;

export type ClientForwardableCapiEvent =
  (typeof CLIENT_FORWARDABLE_CAPI_EVENTS)[number];

export type CapiEventName = ClientForwardableCapiEvent | "Purchase";

function resolvePurchaseEventSourceUrl(
  metadata: Record<string, unknown>,
): string {
  const origin = serverEnv.appUrl.replace(/\/+$/, "");
  const userId = metadata.user_id;

  if (typeof userId === "string" && userId.length > 0) {
    return `${origin}/checkout/success`;
  }

  return `${origin}/thank-you`;
}

function buildUserData(input: {
  customer?: MetaCustomerInfo | null;
  email?: string | null;
  attribution: MetaAttribution;
}) {
  const customerInfo: MetaCustomerInfo = {
    ...(input.customer ?? {}),
    email: input.customer?.email ?? input.email ?? null,
  };

  const userData: Record<string, string | string[]> = {
    ...buildHashedCustomerUserData(customerInfo),
  };

  if (input.attribution.clientIp) {
    userData.client_ip_address = input.attribution.clientIp;
  }
  if (input.attribution.userAgent) {
    userData.client_user_agent = input.attribution.userAgent;
  }
  if (input.attribution.fbp) {
    userData.fbp = input.attribution.fbp;
  }
  if (input.attribution.fbc) {
    userData.fbc = input.attribution.fbc;
  }

  return userData;
}

export type SendCapiEventInput = {
  eventName: CapiEventName;
  eventId: string;
  eventSourceUrl: string;
  email?: string | null;
  customer?: MetaCustomerInfo | null;
  attribution: MetaAttribution;
  customData?: Record<string, unknown>;
  eventTimeSeconds?: number;
};

/**
 * Send any website event to Meta Conversions API.
 * Never throws — failures are logged only.
 */
export async function sendCapiEvent(input: SendCapiEventInput): Promise<void> {
  try {
    const accessToken = serverEnv.metaCapiAccessToken;
    const eventId = input.eventId.trim();
    const eventSourceUrl = input.eventSourceUrl.trim();

    if (!accessToken || !FB_PIXEL_ID || !eventId || !eventSourceUrl) {
      return;
    }

    const userData = buildUserData({
      email: input.email,
      customer: input.customer,
      attribution: input.attribution,
    });

    if (!userData.client_user_agent) {
      console.error(
        JSON.stringify({
          level: "error",
          route: "meta/capi",
          category: "unknown",
          message: `Meta CAPI ${input.eventName}: missing client_user_agent (sending anyway)`,
          timestamp: new Date().toISOString(),
        }),
      );
    }

    const eventPayload: Record<string, unknown> = {
      event_name: input.eventName,
      event_time: input.eventTimeSeconds ?? Math.floor(Date.now() / 1000),
      event_id: eventId,
      action_source: "website",
      event_source_url: eventSourceUrl,
      user_data: userData,
    };

    if (input.customData && Object.keys(input.customData).length > 0) {
      eventPayload.custom_data = input.customData;
    }

    const body: {
      data: Array<Record<string, unknown>>;
      test_event_code?: string;
    } = {
      data: [eventPayload],
    };

    const testCode = serverEnv.metaCapiTestEventCode;
    if (testCode) {
      body.test_event_code = testCode;
    }

    const url = new URL(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${FB_PIXEL_ID}/events`,
    );
    url.searchParams.set("access_token", accessToken);

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error(
        JSON.stringify({
          level: "error",
          route: "meta/capi",
          category: "unknown",
          message: `Meta CAPI ${input.eventName} failed: ${response.status} ${errorText.slice(0, 300)}`,
          timestamp: new Date().toISOString(),
        }),
      );
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : `Meta CAPI ${input.eventName} failed.`;
    console.error(
      JSON.stringify({
        level: "error",
        route: "meta/capi",
        category: "unknown",
        message,
        timestamp: new Date().toISOString(),
      }),
    );
  }
}

export type SendPurchaseEventInput = {
  paymentId: string;
  email?: string | null;
  customer?: MetaCustomerInfo | null;
  metadata?: Record<string, unknown>;
  attribution?: MetaAttribution;
  eventSourceUrl?: string;
  eventTimeSeconds?: number;
};

/**
 * Send a Purchase event to Meta Conversions API.
 * Never throws — failures are logged so payments/webhooks stay safe.
 */
export async function sendPurchaseEvent(
  input: SendPurchaseEventInput,
): Promise<void> {
  const metadata = input.metadata ?? {};
  const attribution =
    input.attribution ?? metaAttributionFromMetadata(metadata);

  await sendCapiEvent({
    eventName: "Purchase",
    eventId: input.paymentId,
    eventSourceUrl:
      input.eventSourceUrl?.trim() ||
      resolvePurchaseEventSourceUrl(metadata),
    email: input.email,
    customer: input.customer,
    attribution,
    customData: {
      value: publicConfig.lifetimeAccessPriceUsd,
      currency: "USD",
      order_id: input.paymentId,
    },
    eventTimeSeconds: input.eventTimeSeconds,
  });
}

/**
 * Send Purchase CAPI using live page request cookies/IP/UA (thank-you / success backup).
 * Never throws.
 */
export async function sendPurchaseEventFromPageRequest(input: {
  paymentId: string;
  email?: string | null;
  customer?: MetaCustomerInfo | null;
  eventSourceUrl: string;
  requestHeaders: Headers;
}): Promise<void> {
  const paymentId = input.paymentId.trim();
  if (!paymentId) {
    return;
  }

  const origin = serverEnv.appUrl.replace(/\/+$/, "") || "http://localhost:3000";
  const request = new Request(origin, {
    headers: input.requestHeaders,
  });
  const attribution = getMetaAttributionFromRequest(request, {
    eventSourceUrl: input.eventSourceUrl,
  });

  await sendPurchaseEvent({
    paymentId,
    email: input.email,
    customer: input.customer,
    attribution,
    eventSourceUrl: input.eventSourceUrl,
  });
}

/**
 * LTD Purchase for payment webhooks.
 * Awaits Meta send; never throws (errors swallowed in sendPurchaseEvent).
 */
export async function trackLtdPurchaseFromPayment(input: {
  paymentId: string;
  email?: string | null;
  name?: string | null;
  cardHolderName?: string | null;
  dodoCustomerId?: string | null;
  billing?: MetaBillingAddress | null;
  metadata: Record<string, unknown>;
  productCart?: Array<{ product_id: string; quantity: number }> | null;
  expectedProductId: string;
}): Promise<void> {
  const cart = input.productCart;
  if (cart?.length) {
    const isLtd = cart.some(
      (item) => item.product_id === input.expectedProductId,
    );
    if (!isLtd) {
      return;
    }
  }

  const userIdFromMetadata =
    typeof input.metadata.user_id === "string"
      ? input.metadata.user_id
      : null;

  await sendPurchaseEvent({
    paymentId: input.paymentId,
    email: input.email,
    customer: metaCustomerInfoFromDodo({
      email: input.email,
      name: input.name,
      cardHolderName: input.cardHolderName,
      billing: input.billing,
      dodoCustomerId: input.dodoCustomerId,
      userId: userIdFromMetadata,
    }),
    metadata: input.metadata,
  });
}
