import { readFile } from "fs/promises";

import { NextResponse } from "next/server";

import {
  getStoreDownloadAbsolutePath,
  STORE_DOWNLOAD_FILE,
} from "@/lib/store/download";
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

    if (token) {
      const purchase = await getPaidPurchaseByDownloadToken(token);
      allowed = Boolean(purchase);
    } else if (paymentId) {
      const razorpayPurchase = await getPaidPurchaseByPaymentId(paymentId);
      if (razorpayPurchase) {
        allowed = true;
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

    const file = await readFile(getStoreDownloadAbsolutePath());

    return new NextResponse(file, {
      status: 200,
      headers: {
        "Content-Type": STORE_DOWNLOAD_FILE.contentType,
        "Content-Disposition": `attachment; filename="${STORE_DOWNLOAD_FILE.fileName}"`,
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
