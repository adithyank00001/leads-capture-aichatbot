import { NextResponse } from "next/server";

import {
  getMetaAttributionFromRequest,
  metaAttributionToMetadata,
} from "@/lib/meta/attribution";
import { isValidStoreEmail, normalizeStoreEmail } from "@/lib/store/email";
import { STORE_PRODUCT_SLUG } from "@/lib/store/download";
import { createStorePurchase } from "@/lib/store/purchases";
import { getRazorpayClient, getRazorpayKeyId } from "@/lib/store/razorpay";
import { storeProduct } from "@/lib/store/product-content";

type OrderBody = {
  quantity?: number;
  selections?: Record<string, string>;
  email?: string;
  eventSourceUrl?: string;
};

function computeUnitPrice(selections: Record<string, string>) {
  let total = storeProduct.price;
  for (const option of storeProduct.options) {
    const selected = selections[option.id] ?? storeProduct.defaultSelections[option.id];
    const match = option.values.find((value) => value.value === selected);
    if (match?.priceAdjust) {
      total += match.priceAdjust;
    }
  }
  return total;
}

export async function GET() {
  try {
    getRazorpayKeyId();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          message:
            error instanceof Error ? error.message : "Razorpay is not ready.",
        },
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as OrderBody;
    const email = normalizeStoreEmail(body.email);

    if (!isValidStoreEmail(email)) {
      return NextResponse.json(
        { ok: false, error: { message: "Please enter a valid email." } },
        { status: 400 },
      );
    }

    const quantity = Math.min(20, Math.max(1, Number(body.quantity) || 1));
    const selections = {
      ...storeProduct.defaultSelections,
      ...(body.selections ?? {}),
    };

    const unitPrice = computeUnitPrice(selections);
    const amountMajor = unitPrice * quantity;
    const currency = storeProduct.currency.toUpperCase();
    const amountPaise = Math.round(amountMajor * 100);

    if (!Number.isFinite(amountPaise) || amountPaise < 100) {
      return NextResponse.json(
        { ok: false, error: { message: "Invalid amount." } },
        { status: 400 },
      );
    }

    const eventSourceUrl =
      typeof body.eventSourceUrl === "string" && body.eventSourceUrl.trim()
        ? body.eventSourceUrl.trim()
        : undefined;

    const attribution = getMetaAttributionFromRequest(request, {
      eventSourceUrl,
    });
    const metaNotes = metaAttributionToMetadata(attribution);

    const receipt = `store_${Date.now()}`.slice(0, 40);
    const order = await getRazorpayClient().orders.create({
      amount: amountPaise,
      currency,
      receipt,
      notes: {
        product_slug: STORE_PRODUCT_SLUG,
        product_title: storeProduct.title,
        quantity: String(quantity),
        customer_email: email,
        ...metaNotes,
      },
    });

    await createStorePurchase({
      productSlug: STORE_PRODUCT_SLUG,
      productTitle: storeProduct.title,
      amountPaise,
      currency,
      quantity,
      selections,
      razorpayOrderId: order.id,
      customerEmail: email,
      metaAttribution: metaNotes,
    });

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: getRazorpayKeyId(),
      productName: storeProduct.brandName,
      description: "Complete payment to receive your leads database",
      email,
    });
  } catch (error) {
    console.error("[store/razorpay/order]", error);
    return NextResponse.json(
      {
        ok: false,
        error: {
          message:
            error instanceof Error ? error.message : "Failed to create order.",
        },
      },
      { status: 500 },
    );
  }
}
