import "server-only";

import path from "path";

import type { StoreProductConfig } from "@/lib/store/product-content";
import {
  getStoreProductForPurchaseSlug,
  LIVE_ADS_PRODUCT_SLUG,
  storeProduct,
} from "@/lib/store/products";

/**
 * Paid digital downloads — files live outside `public/` so they are never
 * reachable by a direct URL. Only `/api/store/download` and the purchase
 * email may read them.
 */

/** Live ads product slug. Kept for older imports. */
export const STORE_PRODUCT_SLUG = LIVE_ADS_PRODUCT_SLUG;

/** Live ads product file. Kept for older imports. */
export const STORE_DOWNLOAD_FILE = storeProduct.download;

export type ResolvedStoreDownload = {
  absolutePath: string;
  fileName: string;
  contentType: string;
};

const PRIVATE_ROOT = path.join(process.cwd(), "private");

function resolveDownload(product: StoreProductConfig): ResolvedStoreDownload | null {
  const absolutePath = path.resolve(PRIVATE_ROOT, product.download.relativePrivatePath);
  if (!absolutePath.startsWith(PRIVATE_ROOT + path.sep)) {
    return null;
  }
  return {
    absolutePath,
    fileName: product.download.fileName,
    contentType: product.download.contentType,
  };
}

/**
 * File for a paid purchase. Empty or legacy slug = live ads product.
 * Unknown slug = null, so we never hand out another product's file.
 */
export function getStoreDownloadForSlug(
  slug: string | null | undefined,
): ResolvedStoreDownload | null {
  const product = getStoreProductForPurchaseSlug(slug);
  return product ? resolveDownload(product) : null;
}

export function getStoreDownloadAbsolutePath() {
  return resolveDownload(storeProduct)!.absolutePath;
}
