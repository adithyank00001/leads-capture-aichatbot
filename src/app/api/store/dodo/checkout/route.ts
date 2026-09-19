import { NextResponse } from "next/server";

import { getRequestOrigin } from "@/lib/auth/oauth";
import { getMetaAttributionFromRequest } from "@/lib/meta/attribution";
import { createStoreDodoCheckoutSession } from "@/lib/store/dodo-checkout";

export const runtime = "nodejs";

type Body = {
  quantity?: number;
};

export async function POST(request: Request) {
  try {
    let quantity = 1;
    try {
      const body = (await request.json()) as Body;
      if (typeof body.quantity === "number" && Number.isFinite(body.quantity)) {
        quantity = Math.min(20, Math.max(1, Math.floor(body.quantity)));
      }
    } catch {
      // empty body ok
    }

    const origin = getRequestOrigin(request);
    const attribution = getMetaAttributionFromRequest(request, {
      eventSourceUrl: `${origin.replace(/\/+$/, "")}/store/product`,
    });

    const session = await createStoreDodoCheckoutSession({
      origin,
      quantity,
      attribution,
    });

    if (!session.checkout_url) {
      return NextResponse.json(
        { ok: false, error: { message: "Could not start checkout. Please try again." } },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      checkoutUrl: session.checkout_url,
      sessionId: session.session_id,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not start checkout.";
    const status =
      typeof error === "object" &&
      error &&
      "status" in error &&
      typeof (error as { status?: unknown }).status === "number"
        ? ((error as { status: number }).status)
        : 500;

    console.error("[store/dodo/checkout]", error);
    return NextResponse.json(
      { ok: false, error: { message } },
      { status: status >= 400 && status < 600 ? status : 500 },
    );
  }
}

/** Warm / health for store checkout */
export async function GET() {
  return NextResponse.json({ ok: true, provider: "dodo", mode: "store" });
}
