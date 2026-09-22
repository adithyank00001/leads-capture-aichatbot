import { after, NextResponse } from "next/server";

import { serverEnv } from "@/lib/env.server";
import {
  metaAttributionFromMetadata,
} from "@/lib/meta/attribution";
import { sendPurchaseEvent } from "@/lib/meta/capi";
import {
  getMetaAttributionFromPurchase,
  markStorePurchasePaid,
} from "@/lib/store/purchases";
import { sendStorePurchaseEmail } from "@/lib/store/send-purchase-email";
import { verifyRazorpayWebhookSignature } from "@/lib/store/verify";

type RazorpayWebhookPayload = {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        email?: string | null;
        contact?: string | null;
        status?: string;
        notes?: Record<string, string> | null;
      };
    };
  };
};

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature") ?? "";

    // In local/test, webhook secret may not be set yet.
    // If secret is configured, signature must be valid.
    if (process.env.RAZORPAY_WEBHOOK_SECRET?.trim()) {
      const valid = verifyRazorpayWebhookSignature(rawBody, signature);
      if (!valid) {
        return NextResponse.json(
          { ok: false, error: { message: "Invalid webhook signature." } },
          { status: 400 },
        );
      }
    }

    const body = JSON.parse(rawBody) as RazorpayWebhookPayload;
    const event = body.event;
    const payment = body.payload?.payment?.entity;

    if (
      (event === "payment.captured" || event === "order.paid") &&
      payment?.id &&
      payment.order_id
    ) {
      const purchase = await markStorePurchasePaid({
        razorpayOrderId: payment.order_id,
        razorpayPaymentId: payment.id,
        customerEmail: payment.email ?? null,
        customerPhone: payment.contact ?? null,
      });

      const email = purchase.customer_email ?? payment.email ?? null;
      const origin =
        serverEnv.appUrl.replace(/\/+$/, "") || "http://localhost:3000";
      const eventSourceUrl = `${origin}/store/success`;

      const storedMeta = getMetaAttributionFromPurchase(purchase);
      const notesMeta = payment.notes
        ? metaAttributionFromMetadata(payment.notes)
        : {};
      const fromStored = metaAttributionFromMetadata(storedMeta);
      const attribution = {
        fbp: fromStored.fbp ?? notesMeta.fbp,
        fbc: fromStored.fbc ?? notesMeta.fbc,
        clientIp: fromStored.clientIp ?? notesMeta.clientIp,
        userAgent: fromStored.userAgent ?? notesMeta.userAgent,
      };

      // Ack Razorpay fast; finish Meta + email in background (same as Dodo).
      after(async () => {
        await Promise.all([
          sendPurchaseEvent({
            paymentId: payment.id,
            email,
            customer: {
              email,
              fullName: purchase.customer_name,
            },
            attribution,
            eventSourceUrl,
            customData: {
              value: purchase.amount_paise / 100,
              currency: (purchase.currency || "INR").toUpperCase(),
              order_id: purchase.razorpay_order_id,
              content_ids: [purchase.product_slug],
              content_name: purchase.product_title,
              content_type: "product",
              num_items: purchase.quantity,
            },
          }),
          sendStorePurchaseEmail({
            toEmail: email,
            paymentId: payment.id,
            customerName: purchase.customer_name,
            productTitle: purchase.product_title,
            value: purchase.amount_paise / 100,
            currency: purchase.currency,
          }),
        ]);
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[store/razorpay/webhook]", error);
    return NextResponse.json(
      {
        ok: false,
        error: {
          message:
            error instanceof Error ? error.message : "Webhook handling failed.",
        },
      },
      { status: 500 },
    );
  }
}
