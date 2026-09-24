/**
 * ============================================================
 * STORE PRODUCT REGISTRY — list of every sellable product.
 * To add a product: read STORE-PRODUCT-GUIDE.md at the project root.
 * ============================================================
 */

import type { StoreProductConfig } from "@/lib/store/product-content";
import { panIndiaLeads2026 } from "@/lib/store/products/pan-india-leads-2026";
import { usaLeads } from "@/lib/store/products/usa-leads";

/**
 * Live ads product. Served ONLY at /store/product.
 * Never change this value unless the user explicitly asks.
 */
export const LIVE_ADS_PRODUCT_SLUG = "pan-india-leads-2026";

/** URL of the live ads product page. Never change. */
export const LIVE_ADS_PRODUCT_PATH = "/store/product";

/**
 * Old slugs saved on past purchases before the store was renamed.
 * Those buyers must keep getting the live ads product's file. Never remove.
 * These are NOT pages and are never used for new orders.
 */
const LEGACY_LIVE_PURCHASE_SLUGS = ["poster-pack"];

/**
 * NEXT_PUBLIC_STORE_PRICE_INR overrides the price of the live ads product ONLY.
 * Other products always use the price written in their own file.
 */
function withLivePriceOverride(product: StoreProductConfig): StoreProductConfig {
  if (product.slug !== LIVE_ADS_PRODUCT_SLUG) {
    return product;
  }
  const raw = process.env.NEXT_PUBLIC_STORE_PRICE_INR?.trim();
  if (!raw) {
    return product;
  }
  const override = Number.parseFloat(raw);
  if (!Number.isFinite(override) || override <= 0) {
    return product;
  }
  return { ...product, price: override };
}

/**
 * ADD NEW PRODUCTS HERE.
 * 1. Import the product file at the top of this file.
 * 2. Add it to this list.
 */
const REGISTERED_PRODUCTS: StoreProductConfig[] = [
  panIndiaLeads2026,
  usaLeads,
];

export const storeProducts: StoreProductConfig[] =
  REGISTERED_PRODUCTS.map(withLivePriceOverride);

const productsBySlug = new Map(
  storeProducts.map((product) => [product.slug, product]),
);

if (productsBySlug.size !== storeProducts.length) {
  throw new Error("Two store products use the same slug. Every slug must be unique.");
}

/** Live ads product (PAN India). Same object the /store/product page renders. */
export const storeProduct: StoreProductConfig = (() => {
  const live = productsBySlug.get(LIVE_ADS_PRODUCT_SLUG);
  if (!live) {
    throw new Error(`Live ads product "${LIVE_ADS_PRODUCT_SLUG}" is not registered.`);
  }
  return live;
})();

export function getStoreProductBySlug(
  slug: string | null | undefined,
): StoreProductConfig | null {
  if (!slug) {
    return null;
  }
  return productsBySlug.get(slug.trim()) ?? null;
}

/**
 * Product for a saved purchase row (download + email).
 * Empty or legacy slug = live ads product. Unknown slug = null.
 */
export function getStoreProductForPurchaseSlug(
  slug: string | null | undefined,
): StoreProductConfig | null {
  const trimmed = slug?.trim() ?? "";
  if (!trimmed || LEGACY_LIVE_PURCHASE_SLUGS.includes(trimmed)) {
    return storeProduct;
  }
  return getStoreProductBySlug(trimmed);
}

/** Products shown on the store homepage (published: true). */
export function getPublishedStoreProducts(): StoreProductConfig[] {
  return storeProducts.filter((product) => product.published);
}

/** Public page URL for a product. Live ads product always uses /store/product. */
export function getStoreProductPath(product: Pick<StoreProductConfig, "slug">): string {
  return product.slug === LIVE_ADS_PRODUCT_SLUG
    ? LIVE_ADS_PRODUCT_PATH
    : `/store/product/${product.slug}`;
}
