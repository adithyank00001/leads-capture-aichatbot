"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const ProductReviewForm = dynamic(
  () =>
    import("@/components/store/product-review-form").then(
      (m) => m.ProductReviewForm,
    ),
  { ssr: false },
);

/** Mount the review form after idle so the buy path stays light. */
export function ProductReviewFormLazy() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const win = window as Window & {
      requestIdleCallback?: (
        callback: IdleRequestCallback,
        options?: IdleRequestOptions,
      ) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    if (typeof win.requestIdleCallback === "function") {
      const idleId = win.requestIdleCallback(() => setReady(true), {
        timeout: 2500,
      });
      return () => win.cancelIdleCallback?.(idleId);
    }

    const timeoutId = window.setTimeout(() => setReady(true), 1200);
    return () => window.clearTimeout(timeoutId);
  }, []);

  if (!ready) return null;
  return <ProductReviewForm />;
}
