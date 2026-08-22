import { Webhooks } from "@dodopayments/nextjs";
import { NextResponse, type NextRequest } from "next/server";

import { grantLifetimeAccessFromPayment } from "@/lib/billing/lifetime-access";
import { serverEnv } from "@/lib/env.server";
import { trackLtdPurchaseFromPayment } from "@/lib/meta/capi";

type WebhookHandler = (request: NextRequest) => Promise<NextResponse>;

let webhookHandler: WebhookHandler | null = null;

function getWebhookHandler() {
  if (webhookHandler) {
    return webhookHandler;
  }

  const webhookKey = serverEnv.dodoPaymentsWebhookKey;

  if (!webhookKey) {
    throw new Error("DODO_PAYMENTS_WEBHOOK_KEY is not configured.");
  }

  webhookHandler = Webhooks({
    webhookKey,
    onPaymentSucceeded: async (payload) => {
      if (payload.data.payload_type !== "Payment") {
        return;
      }

      const payment = {
        payment_id: payload.data.payment_id,
        metadata: payload.data.metadata,
        customer: payload.data.customer,
        product_cart: payload.data.product_cart ?? undefined,
      };

      await grantLifetimeAccessFromPayment(payment);

      const productId = serverEnv.dodoLtdProductId;
      if (productId) {
        trackLtdPurchaseFromPayment({
          paymentId: payment.payment_id,
          email: payment.customer.email,
          metadata: payment.metadata,
          productCart: payment.product_cart,
          expectedProductId: productId,
        });
      }
    },
  });

  return webhookHandler;
}

export async function POST(request: NextRequest) {
  try {
    return await getWebhookHandler()(request);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook handler failed.";

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "WEBHOOK_NOT_CONFIGURED",
          message,
        },
      },
      { status: 503 },
    );
  }
}
