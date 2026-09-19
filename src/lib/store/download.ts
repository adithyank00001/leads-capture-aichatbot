import "server-only";

import path from "path";

/**
 * Paid digital download — file lives outside `public/` so it is never
 * reachable by a direct URL. Only `/api/store/download` may read it.
 */
export const STORE_DOWNLOAD_FILE = {
  /** Path under project `private/` (not web-accessible). */
  relativePrivatePath:
    "store/downloads/ALL-INDIA-COMPLETE-DATABASE-PACKAGE-BUNDLE-2026.pdf",
  fileName: "ALL-INDIA-COMPLETE-DATABASE-PACKAGE-BUNDLE-2026.pdf",
  contentType: "application/pdf",
} as const;

export const STORE_PRODUCT_SLUG = "pan-india-leads-2026";

export function getStoreDownloadAbsolutePath() {
  return path.join(
    process.cwd(),
    "private",
    STORE_DOWNLOAD_FILE.relativePrivatePath,
  );
}
