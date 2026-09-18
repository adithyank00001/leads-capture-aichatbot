import { NextResponse } from "next/server";

import { markStorePurchasePaid } from "@/lib/store/purchases";
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
      await markStorePurchasePaid({
        razorpayOrderId: payment.order_id,
        razorpayPaymentId: payment.id,
        customerEmail: payment.email ?? null,
        customerPhone: payment.contact ?? null,
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
