import type { MetaCustomerInfo } from "@/lib/meta/user-data";

type StorePurchaseMetaInput = {
  paymentId: string;
  orderId?: string | null;
  email?: string | null;
  phone?: string | null;
  fullName?: string | null;
  productSlug: string;
  productTitle: string;
  value: number;
  currency: string;
  quantity: number;
};

/**
 * Max useful Meta customer match fields from what we already have
 * (Razorpay + India store). No invented city/state/zip.
 */
export function buildStorePurchaseCustomer(
  input: StorePurchaseMetaInput,
): MetaCustomerInfo {
  const externalIds = [input.paymentId, input.orderId]
    .map((id) => (typeof id === "string" ? id.trim() : ""))
    .filter(Boolean);

  return {
    email: input.email ?? null,
    phone: input.phone ?? null,
    fullName: input.fullName?.trim() || null,
    country: "in",
    ...(externalIds.length > 0 ? { externalIds } : {}),
  };
}

/**
 * Rich Purchase custom_data for Pixel/CAPI (product + money + line items).
 */
export function buildStorePurchaseCustomData(input: StorePurchaseMetaInput) {
  const quantity = Math.max(1, input.quantity || 1);
  const value = input.value;
  const itemPrice = quantity > 0 ? value / quantity : value;
  const currency = (input.currency || "INR").toUpperCase();
  const orderId = input.orderId?.trim() || input.paymentId;

  return {
    value,
    currency,
    order_id: orderId,
    content_ids: [input.productSlug],
    content_name: input.productTitle,
    content_type: "product",
    content_category: "digital_leads_database",
    num_items: quantity,
    contents: [
      {
        id: input.productSlug,
        quantity,
        item_price: itemPrice,
      },
    ],
  };
}
