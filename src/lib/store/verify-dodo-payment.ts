import "server-only";

import { createDodoPaymentsClient, getDodoStoreProductId } from "@/lib/store/dodo-checkout";
import { normalizeEmail } from "@/lib/billing/normalize-email";
import {
  metaCustomerInfoFromDodo,
  type MetaCustomerInfo,
} from "@/lib/meta/user-data";
import { storeProduct } from "@/lib/store/product-content";
import { serverEnv } from "@/lib/env.server";

export type StorePaymentVerification =
  | {
      ok: true;
      paymentId: string;
      email: string | null;
      customer: MetaCustomerInfo | null;
      value: number;
      currency: string;
      quantity: number;
      productTitle: string;
      productSlug: string;
      digitalProductsDelivered: boolean;
      driveDownloadUrl: string | null;
    }
  | { ok: false; reason?: string };

function isSuccessfulPaymentStatus(status: string | null | undefined) {
  return status?.trim().toLowerCase() === "succeeded";
}

function paymentIncludesStoreProduct(
  productCart: Array<{ product_id: string; quantity: number }> | null | undefined,
  expectedProductId: string,
  metadata: Record<string, unknown> | null | undefined,
) {
  if (productCart?.length) {
    return productCart.some((item) => item.product_id === expectedProductId);
  }
  // Fail closed: empty cart only OK when checkout metadata marks this as store.
  return metadata?.flow === "store_digital";
}

function readCustomerEmail(customer: unknown): string | null {
  if (
    typeof customer === "object" &&
    customer &&
    "email" in customer &&
    typeof (customer as { email?: unknown }).email === "string"
  ) {
    return normalizeEmail((customer as { email: string }).email) || null;
  }
  return null;
}

function readCustomerName(customer: unknown): string | null {
  if (
    typeof customer === "object" &&
    customer &&
    "name" in customer &&
    typeof (customer as { name?: unknown }).name === "string"
  ) {
    const name = (customer as { name: string }).name.trim();
    return name || null;
  }
  return null;
}

function readCustomerId(customer: unknown): string | null {
  if (
    typeof customer === "object" &&
    customer &&
    "customer_id" in customer &&
    typeof (customer as { customer_id?: unknown }).customer_id === "string"
  ) {
    const id = (customer as { customer_id: string }).customer_id.trim();
    return id || null;
  }
  return null;
}

function readBilling(billing: unknown) {
  if (!billing || typeof billing !== "object") return null;
  const record = billing as Record<string, unknown>;
  return {
    country: typeof record.country === "string" ? record.country : null,
    city: typeof record.city === "string" ? record.city : null,
    state: typeof record.state === "string" ? record.state : null,
    street: typeof record.street === "string" ? record.street : null,
    zipcode: typeof record.zipcode === "string" ? record.zipcode : null,
  };
}

function readOptionalString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

/**
 * Verify a Dodo payment belongs to the store digital product and succeeded.
 */
export async function verifyStoreDodoPayment(input: {
  paymentId?: string | null;
  status?: string | null;
}): Promise<StorePaymentVerification> {
  const paymentId = input.paymentId?.trim();
  if (!paymentId) {
    return { ok: false, reason: "missing_payment_id" };
  }

  // Dodo may append status=succeeded on return_url; still re-check via API.
  try {
    const storeProductId = getDodoStoreProductId();
    const client = createDodoPaymentsClient();
    const payment = await client.payments.retrieve(paymentId);

    if (!isSuccessfulPaymentStatus(payment.status)) {
      return { ok: false, reason: "not_succeeded" };
    }

    if (
      !paymentIncludesStoreProduct(
        payment.product_cart,
        storeProductId,
        (payment.metadata as Record<string, unknown> | null | undefined) ?? null,
      )
    ) {
      return { ok: false, reason: "wrong_product" };
    }

    const email = readCustomerEmail(payment.customer);
    const quantity =
      payment.product_cart?.reduce((sum, item) => sum + (item.quantity || 1), 0) ||
      1;

    // total_amount is in smallest currency unit (paise for INR).
    const totalAmount = Number(payment.total_amount);
    const value =
      Number.isFinite(totalAmount) && totalAmount > 0
        ? totalAmount / 100
        : storeProduct.price * quantity;

    const currency = (payment.currency || "INR").toUpperCase();

    return {
      ok: true,
      paymentId,
      email,
      customer: metaCustomerInfoFromDodo({
        email,
        name: readCustomerName(payment.customer),
        cardHolderName: readOptionalString(payment.card_holder_name),
        billing: readBilling(payment.billing),
        dodoCustomerId: readCustomerId(payment.customer),
      }),
      value,
      currency,
      quantity,
      productTitle: storeProduct.title,
      productSlug: "pan-india-leads-2026",
      digitalProductsDelivered: Boolean(payment.digital_products_delivered),
      driveDownloadUrl: serverEnv.storeDriveDownloadUrl?.trim() || null,
    };
  } catch {
    return { ok: false, reason: "verify_failed" };
  }
}
