import { Webhooks } from "@dodopayments/nextjs";
import { after, NextResponse, type NextRequest } from "next/server";

import { grantLifetimeAccessFromPayment } from "@/lib/billing/lifetime-access";
import { serverEnv } from "@/lib/env.server";
import {
  trackLtdPurchaseFromPayment,
  trackStorePurchaseFromPayment,
} from "@/lib/meta/capi";
import { storeProduct } from "@/lib/store/product-content";

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

      const data = payload.data as typeof payload.data & {
        total_amount?: number;
        currency?: string;
      };

      const payment = {
        payment_id: data.payment_id,
        metadata: data.metadata,
        customer: data.customer,
        billing: data.billing,
        card_holder_name: data.card_holder_name,
        product_cart: data.product_cart ?? undefined,
        total_amount: data.total_amount,
        currency: data.currency,
      };

      const storeProductId = serverEnv.dodoStoreProductId?.trim();
      const ltdProductId = serverEnv.dodoLtdProductId?.trim();
      const cart = payment.product_cart ?? [];
      const isStorePurchase =
        Boolean(storeProductId) &&
        (cart.some((item) => item.product_id === storeProductId) ||
          payment.metadata?.flow === "store_digital");

      // LTD SaaS access — skip for pure store digital purchases.
      if (!isStorePurchase) {
        await grantLifetimeAccessFromPayment(payment);
      }

      if (isStorePurchase && storeProductId) {
        const quantity =
          cart.reduce((sum, item) => sum + (item.quantity || 1), 0) || 1;
        const totalAmount = Number(payment.total_amount);
        const value =
          Number.isFinite(totalAmount) && totalAmount > 0
            ? totalAmount / 100
            : storeProduct.price * quantity;

        after(() =>
          trackStorePurchaseFromPayment({
            paymentId: payment.payment_id,
            email: payment.customer.email,
            name: payment.customer.name,
            cardHolderName:
              typeof payment.card_holder_name === "string"
                ? payment.card_holder_name
                : null,
            dodoCustomerId: payment.customer.customer_id,
            billing: payment.billing,
            metadata: payment.metadata,
            productCart: payment.product_cart,
            expectedProductId: storeProductId,
            value,
            currency: payment.currency || "INR",
            contentName: storeProduct.title,
            contentIds: ["pan-india-leads-2026"],
            numItems: quantity,
          }),
        );
        return;
      }

      if (ltdProductId) {
        after(() =>
          trackLtdPurchaseFromPayment({
            paymentId: payment.payment_id,
            email: payment.customer.email,
            name: payment.customer.name,
            cardHolderName:
              typeof payment.card_holder_name === "string"
                ? payment.card_holder_name
                : null,
            dodoCustomerId: payment.customer.customer_id,
            billing: payment.billing,
            metadata: payment.metadata,
            productCart: payment.product_cart,
            expectedProductId: ltdProductId,
          }),
        );
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
