import { after, NextResponse } from "next/server";

import { serverEnv } from "@/lib/env.server";
import {
  getMetaAttributionFromRequest,
  metaAttributionFromMetadata,
} from "@/lib/meta/attribution";
import { sendPurchaseEvent } from "@/lib/meta/capi";
import { isValidStoreEmail, normalizeStoreEmail } from "@/lib/store/email";
import {
  getMetaAttributionFromPurchase,
  markStorePurchasePaid,
} from "@/lib/store/purchases";
import { getRazorpayClient } from "@/lib/store/razorpay";
import { sendStorePurchaseEmail } from "@/lib/store/send-purchase-email";
import { verifyRazorpayPaymentSignature } from "@/lib/store/verify";

type VerifyBody = {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  customer_email?: string | null;
};

async function fetchRazorpayPaymentEmail(paymentId: string): Promise<{
  email: string | null;
  phone: string | null;
  name: string | null;
}> {
  try {
    const payment = await getRazorpayClient().payments.fetch(paymentId);
    const emailRaw =
      typeof payment.email === "string" ? payment.email : null;
    const phoneRaw =
      typeof payment.contact === "string" ? payment.contact : null;
    const nameRaw =
      typeof (payment as { name?: unknown }).name === "string"
        ? ((payment as { name?: string }).name ?? null)
        : null;

    return {
      email: isValidStoreEmail(emailRaw)
        ? normalizeStoreEmail(emailRaw)
        : null,
      phone: phoneRaw?.trim() || null,
      name: nameRaw?.trim() || null,
    };
  } catch (error) {
    console.error("[store/razorpay/verify] payment fetch", error);
    return { email: null, phone: null, name: null };
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as VerifyBody;
    const orderId = body.razorpay_order_id?.trim();
    const paymentId = body.razorpay_payment_id?.trim();
    const signature = body.razorpay_signature?.trim();
    const modalEmail = isValidStoreEmail(body.customer_email)
      ? normalizeStoreEmail(body.customer_email)
      : null;

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        { ok: false, error: { message: "Missing payment details." } },
        { status: 400 },
      );
    }

    const valid = verifyRazorpayPaymentSignature({
      orderId,
      paymentId,
      signature,
    });

    if (!valid) {
      return NextResponse.json(
        { ok: false, error: { message: "Invalid payment signature." } },
        { status: 400 },
      );
    }

    // Prefer email from our modal; Razorpay payment email is backup.
    const razorpayCustomer = await fetchRazorpayPaymentEmail(paymentId);
    const customerEmail = modalEmail ?? razorpayCustomer.email;

    const purchase = await markStorePurchasePaid({
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: signature,
      customerEmail,
      customerPhone: razorpayCustomer.phone,
      customerName: razorpayCustomer.name,
    });

    const email = purchase.customer_email ?? customerEmail;
    const origin =
      serverEnv.appUrl.replace(/\/+$/, "") || "http://localhost:3000";
    const eventSourceUrl = `${origin}/store/success`;
    const liveAttribution = getMetaAttributionFromRequest(request, {
      eventSourceUrl,
    });
    const storedAttribution = metaAttributionFromMetadata(
      getMetaAttributionFromPurchase(purchase),
    );
    const attribution = {
      fbp: liveAttribution.fbp ?? storedAttribution.fbp,
      fbc: liveAttribution.fbc ?? storedAttribution.fbc,
      clientIp: liveAttribution.clientIp ?? storedAttribution.clientIp,
      userAgent: liveAttribution.userAgent ?? storedAttribution.userAgent,
    };

    // Reply fast to the buyer; finish Meta + email in background (same as Dodo).
    after(async () => {
      await Promise.all([
        sendPurchaseEvent({
          paymentId,
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
          paymentId,
          customerName: purchase.customer_name,
          productTitle: purchase.product_title,
          value: purchase.amount_paise / 100,
          currency: purchase.currency,
        }),
      ]);
    });

    return NextResponse.json({
      ok: true,
      downloadToken: purchase.download_token,
      paymentId: purchase.razorpay_payment_id,
      orderId: purchase.razorpay_order_id,
      redirectUrl: `/store/success?token=${encodeURIComponent(purchase.download_token ?? "")}&payment_id=${encodeURIComponent(paymentId)}`,
    });
  } catch (error) {
    console.error("[store/razorpay/verify]", error);
    return NextResponse.json(
      {
        ok: false,
        error: {
          message:
            error instanceof Error ? error.message : "Payment verification failed.",
        },
      },
      { status: 500 },
    );
  }
}
