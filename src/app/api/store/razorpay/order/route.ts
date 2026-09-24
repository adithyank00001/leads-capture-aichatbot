import { NextResponse } from "next/server";

import {
  getMetaAttributionFromRequest,
  metaAttributionToMetadata,
} from "@/lib/meta/attribution";
import { isValidFbc, isValidFbp } from "@/lib/meta/fbc";
import { isValidStoreEmail, normalizeStoreEmail } from "@/lib/store/email";
import type { StoreProductConfig } from "@/lib/store/product-content";
import { getStoreProductBySlug, storeProduct } from "@/lib/store/products";
import { createStorePurchase } from "@/lib/store/purchases";
import { getRazorpayClient, getRazorpayKeyId } from "@/lib/store/razorpay";

type OrderBody = {
  /** Product slug. Missing = live ads product (older page builds). */
  slug?: string;
  quantity?: number;
  selections?: Record<string, string>;
  email?: string;
  eventSourceUrl?: string;
  fbp?: string;
  fbc?: string;
};

function computeUnitPrice(
  product: StoreProductConfig,
  selections: Record<string, string>,
) {
  let total = product.price;
  for (const option of product.options) {
    const selected = selections[option.id] ?? product.defaultSelections[option.id];
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
    const requestedSlug = typeof body.slug === "string" ? body.slug.trim() : "";
    const product = requestedSlug ? getStoreProductBySlug(requestedSlug) : storeProduct;
    if (!product) {
      return NextResponse.json(
        { ok: false, error: { message: "Unknown product." } },
        { status: 400 },
      );
    }

    // Email is optional here — Razorpay checkout collects email + phone.
    const emailRaw =
      typeof body.email === "string" ? normalizeStoreEmail(body.email) : "";
    const email = isValidStoreEmail(emailRaw) ? emailRaw : null;

    const quantity = Math.min(20, Math.max(1, Number(body.quantity) || 1));
    const selections = {
      ...product.defaultSelections,
      ...(body.selections ?? {}),
    };

    const unitPrice = computeUnitPrice(product, selections);
    const amountMajor = unitPrice * quantity;
    const currency = product.currency.toUpperCase();
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

    const attributionFromRequest = getMetaAttributionFromRequest(request, {
      eventSourceUrl,
    });
    const clientFbp =
      typeof body.fbp === "string" && isValidFbp(body.fbp.trim())
        ? body.fbp.trim()
        : undefined;
    const clientFbc =
      typeof body.fbc === "string" && isValidFbc(body.fbc.trim())
        ? body.fbc.trim()
        : undefined;
    const attribution = {
      fbp: clientFbp ?? attributionFromRequest.fbp,
      fbc: clientFbc ?? attributionFromRequest.fbc,
      clientIp: attributionFromRequest.clientIp,
      userAgent: attributionFromRequest.userAgent,
    };
    const metaNotes = metaAttributionToMetadata(attribution);

    const receipt = `store_${Date.now()}`.slice(0, 40);
    const order = await getRazorpayClient().orders.create({
      amount: amountPaise,
      currency,
      receipt,
      notes: {
        product_slug: product.slug,
        product_title: product.title,
        quantity: String(quantity),
        ...(email ? { customer_email: email } : {}),
        ...metaNotes,
      },
    });

    await createStorePurchase({
      productSlug: product.slug,
      productTitle: product.title,
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
      productName: product.brandName,
      description: "Complete payment to receive your leads database",
      ...(email ? { email } : {}),
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
