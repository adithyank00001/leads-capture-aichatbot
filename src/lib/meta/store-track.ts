import { trackPixelAndCapi } from "@/lib/meta/browser-track";

const STORE_PRODUCT_ID = "pan-india-leads-2026";
const STORE_PRODUCT_NAME =
  "110Cr+ All India Latest Leads (PAN INDIA DATABASE) 2026";

/**
 * Product page viewed — Pixel + CAPI ViewContent (same event_id).
 * Fire once when the PAN India product page loads.
 */
export function trackStoreViewContent(input?: {
  value?: number;
  currency?: string;
  contentName?: string;
  contentIds?: string[];
}): void {
  const value = input?.value ?? 397;
  const currency = input?.currency ?? "INR";
  trackPixelAndCapi("ViewContent", {
    value,
    currency,
    content_name: input?.contentName ?? STORE_PRODUCT_NAME,
    content_ids: input?.contentIds ?? [STORE_PRODUCT_ID],
    content_type: "product",
    content_category: "digital_leads_database",
  });
}

/**
 * Buyer clicked Get now — Pixel + CAPI InitiateCheckout before Razorpay opens.
 */
export function trackStoreInitiateCheckout(input: {
  value: number;
  currency?: string;
  quantity?: number;
  contentName?: string;
  contentIds?: string[];
}): void {
  trackPixelAndCapi("InitiateCheckout", {
    value: input.value,
    currency: input.currency ?? "INR",
    num_items: input.quantity ?? 1,
    content_name: input.contentName ?? STORE_PRODUCT_NAME,
    content_ids: input.contentIds ?? [STORE_PRODUCT_ID],
    content_type: "product",
  });
}

/** Shop homepage “view product” intent (soft signal before product PageView). */
export function trackStoreHomeProductClick(): void {
  trackPixelAndCapi("ViewContent", {
    value: 397,
    currency: "INR",
    content_name: STORE_PRODUCT_NAME,
    content_ids: [STORE_PRODUCT_ID],
    content_type: "product",
    content_category: "shop_home_cta",
  });
}
