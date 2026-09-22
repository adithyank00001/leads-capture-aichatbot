import { trackPixelAndCapi } from "@/lib/meta/browser-track";
import { setPixelUserData } from "@/lib/fbpixel";
import { normalizeStoreEmail } from "@/lib/store/email";

const STORE_PRODUCT_ID = "pan-india-leads-2026";
const STORE_PRODUCT_NAME =
  "110Cr+ All India Latest Leads (PAN INDIA DATABASE) 2026";

function storeContentPayload(input: {
  value: number;
  quantity?: number;
  contentName?: string;
  contentIds?: string[];
}) {
  const quantity = input.quantity ?? 1;
  const contentIds = input.contentIds ?? [STORE_PRODUCT_ID];
  const contentName = input.contentName ?? STORE_PRODUCT_NAME;
  const itemPrice = quantity > 0 ? input.value / quantity : input.value;

  return {
    value: input.value,
    currency: "INR" as const,
    num_items: quantity,
    content_name: contentName,
    content_ids: contentIds,
    content_type: "product",
    content_category: "digital_leads_database",
    contents: contentIds.map((id) => ({
      id,
      quantity,
      item_price: itemPrice,
    })),
  };
}

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
  const payload = storeContentPayload({
    value,
    quantity: 1,
    contentName: input?.contentName,
    contentIds: input?.contentIds,
  });
  trackPixelAndCapi("ViewContent", {
    ...payload,
    currency,
  });
}

/**
 * Real InitiateCheckout — fire on email modal Continue (with email).
 * Pixel Advanced Matching + CAPI hashed email in one shared event_id.
 */
export function trackStoreInitiateCheckout(input: {
  value: number;
  currency?: string;
  quantity?: number;
  contentName?: string;
  contentIds?: string[];
  /** Buyer email from the modal — required for strong Meta matching. */
  email?: string | null;
}): void {
  const email = input.email ? normalizeStoreEmail(input.email) : "";
  if (email) {
    setPixelUserData({ em: email });
  }

  const payload = storeContentPayload({
    value: input.value,
    quantity: input.quantity,
    contentName: input.contentName,
    contentIds: input.contentIds,
  });

  trackPixelAndCapi(
    "InitiateCheckout",
    {
      ...payload,
      currency: input.currency ?? "INR",
    },
    undefined,
    email ? { email } : undefined,
  );
}

/**
 * After email is entered — Advanced Matching only (no new event).
 */
export function attachStoreCheckoutEmail(emailRaw: string): void {
  const email = normalizeStoreEmail(emailRaw);
  if (!email) return;
  setPixelUserData({ em: email });
}

/** Shop homepage “view product” intent (soft signal before product PageView). */
export function trackStoreHomeProductClick(): void {
  trackPixelAndCapi("ViewContent", {
    ...storeContentPayload({ value: 397, quantity: 1 }),
    currency: "INR",
    content_category: "shop_home_cta",
  });
}
