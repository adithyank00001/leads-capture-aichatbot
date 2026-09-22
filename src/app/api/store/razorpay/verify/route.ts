import { after, NextResponse } from "next/server";

import { serverEnv } from "@/lib/env.server";
import {
  getMetaAttributionFromRequest,
  metaAttributionFromMetadata,
} from "@/lib/meta/attribution";
import { sendPurchaseEvent } from "@/lib/meta/capi";
import {
  buildStorePurchaseCustomData,
  buildStorePurchaseCustomer,
} from "@/lib/meta/store-purchase-meta";
import { isValidFbc, isValidFbp } from "@/lib/meta/fbc";
import { isValidStoreEmail, normalizeStoreEmail } from "@/lib/store/email";
import {
  getMetaAttributionFromPurchase,
  markStorePurchasePaid,
} from "@/lib/store/purchases";
import { fetchRazorpayPaymentCustomer } from "@/lib/store/razorpay-customer";
import { sendStorePurchaseEmail } from "@/lib/store/send-purchase-email";
import { verifyRazorpayPaymentSignature } from "@/lib/store/verify";

type VerifyBody = {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  /** Legacy — prefer email collected by Razorpay checkout. */
  customer_email?: string | null;
  fbp?: string;
  fbc?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as VerifyBody;
    const orderId = body.razorpay_order_id?.trim();
    const paymentId = body.razorpay_payment_id?.trim();
    const signature = body.razorpay_signature?.trim();
    const clientEmail = isValidStoreEmail(body.customer_email)
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

    // Razorpay checkout is the source of truth for email + phone + name.
    const razorpayCustomer = await fetchRazorpayPaymentCustomer(paymentId);
    const customerEmail = razorpayCustomer.email ?? clientEmail;

    const purchase = await markStorePurchasePaid({
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: signature,
      customerEmail,
      customerPhone: razorpayCustomer.phone,
      customerName: razorpayCustomer.name,
    });

    const email = purchase.customer_email ?? customerEmail;
    const phone = purchase.customer_phone ?? razorpayCustomer.phone;
    const fullName = purchase.customer_name ?? razorpayCustomer.name;
    const origin =
      serverEnv.appUrl.replace(/\/+$/, "") || "http://localhost:3000";
    const eventSourceUrl = `${origin}/store/success`;
    const liveAttribution = getMetaAttributionFromRequest(request, {
      eventSourceUrl,
    });
    const storedAttribution = metaAttributionFromMetadata(
      getMetaAttributionFromPurchase(purchase),
    );
    const clientFbp =
      typeof body.fbp === "string" && isValidFbp(body.fbp.trim())
        ? body.fbp.trim()
        : undefined;
    const clientFbc =
      typeof body.fbc === "string" && isValidFbc(body.fbc.trim())
        ? body.fbc.trim()
        : undefined;
    const attribution = {
      fbp: clientFbp ?? liveAttribution.fbp ?? storedAttribution.fbp,
      fbc: clientFbc ?? liveAttribution.fbc ?? storedAttribution.fbc,
      clientIp: liveAttribution.clientIp ?? storedAttribution.clientIp,
      userAgent: liveAttribution.userAgent ?? storedAttribution.userAgent,
    };

    const metaInput = {
      paymentId,
      orderId: purchase.razorpay_order_id,
      email,
      phone,
      fullName,
      productSlug: purchase.product_slug,
      productTitle: purchase.product_title,
      value: purchase.amount_paise / 100,
      currency: purchase.currency,
      quantity: purchase.quantity,
    };

    // Reply fast to the buyer; finish Meta + email in background (same as Dodo).
    after(async () => {
      await Promise.all([
        sendPurchaseEvent({
          paymentId,
          email,
          customer: buildStorePurchaseCustomer(metaInput),
          attribution,
          eventSourceUrl,
          customData: buildStorePurchaseCustomData(metaInput),
        }),
        sendStorePurchaseEmail({
          toEmail: email,
          paymentId,
          customerName: fullName,
          productTitle: purchase.product_title,
          value: metaInput.value,
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
