import { readFile } from "fs/promises";

import { NextResponse } from "next/server";

import { getStoreDownloadForSlug } from "@/lib/store/download";
import {
  getPaidPurchaseByDownloadToken,
  getPaidPurchaseByPaymentId,
} from "@/lib/store/purchases";
import { verifyStoreDodoPayment } from "@/lib/store/verify-dodo-payment";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token")?.trim();
    const paymentId = searchParams.get("payment_id")?.trim();

    let allowed = false;
    /** Empty = live ads product (legacy Dodo purchases). */
    let productSlug: string | null = null;

    if (token) {
      const purchase = await getPaidPurchaseByDownloadToken(token);
      allowed = Boolean(purchase);
      productSlug = purchase?.product_slug ?? null;
    } else if (paymentId) {
      const razorpayPurchase = await getPaidPurchaseByPaymentId(paymentId);
      if (razorpayPurchase) {
        allowed = true;
        productSlug = razorpayPurchase.product_slug;
      } else {
        // Legacy Dodo downloads.
        const verification = await verifyStoreDodoPayment({
          paymentId,
          status: "succeeded",
        });
        allowed = verification.ok;
      }
    } else {
      return NextResponse.json(
        { ok: false, error: { message: "Missing download token." } },
        { status: 400 },
      );
    }

    if (!allowed) {
      return NextResponse.json(
        { ok: false, error: { message: "Download not available." } },
        { status: 403 },
      );
    }

    const download = getStoreDownloadForSlug(productSlug);
    if (!download) {
      return NextResponse.json(
        { ok: false, error: { message: "Download not available." } },
        { status: 404 },
      );
    }

    const file = await readFile(download.absolutePath);

    return new NextResponse(file, {
      status: 200,
      headers: {
        "Content-Type": download.contentType,
        "Content-Disposition": `attachment; filename="${download.fileName}"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[store/download]", error);
    return NextResponse.json(
      {
        ok: false,
        error: {
          message:
            error instanceof Error ? error.message : "Download failed.",
        },
      },
      { status: 500 },
    );
  }
}
