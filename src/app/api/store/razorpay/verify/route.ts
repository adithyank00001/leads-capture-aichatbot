import { NextResponse } from "next/server";

import { markStorePurchasePaid } from "@/lib/store/purchases";
import { verifyRazorpayPaymentSignature } from "@/lib/store/verify";

type VerifyBody = {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  customer_email?: string | null;
  customer_phone?: string | null;
  customer_name?: string | null;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as VerifyBody;
    const orderId = body.razorpay_order_id?.trim();
    const paymentId = body.razorpay_payment_id?.trim();
    const signature = body.razorpay_signature?.trim();

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

    const purchase = await markStorePurchasePaid({
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: signature,
      customerEmail: body.customer_email ?? null,
      customerPhone: body.customer_phone ?? null,
      customerName: body.customer_name ?? null,
    });

    return NextResponse.json({
      ok: true,
      downloadToken: purchase.download_token,
      paymentId: purchase.razorpay_payment_id,
      orderId: purchase.razorpay_order_id,
      redirectUrl: `/store/success?token=${encodeURIComponent(purchase.download_token ?? "")}`,
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
