"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronRight, X } from "lucide-react";

import type { CatalogProduct } from "@/lib/store/catalog";

type Props = {
  exploreProduct: CatalogProduct;
  bundlePrice: number;
  onClose: () => void;
  onGetBundle: () => void;
};

/** Explore-card “restocking soon” modal — portaled to body so fixed overlay is not trapped by parent transforms. */
export function ProductExploreModal({
  exploreProduct,
  bundlePrice,
  onClose,
  onGetBundle,
}: Props) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const modal = (
    <div
      className="shop-oos-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Restocking soon"
      onClick={onClose}
    >
      <div
        className="shop-oos-modal store-explore-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="shop-oos-close"
          aria-label="Close"
          onClick={onClose}
        >
          <X className="size-4" />
        </button>
        <p className="store-explore-modal-title">
          🟡 Restocking Licenses Soon (₹{exploreProduct.price})
        </p>
        <p>This standalone database licenses will be restocked soon.</p>
        <p className="store-explore-modal-warning">
          ⚠️ WARNING: The All-India Database currently includes this for just ₹
          {bundlePrice}. This is a flash sale and ending soon.
        </p>
        <div className="store-explore-modal-actions">
          <button
            type="button"
            className="store-btn-primary shop-oos-btn"
            onClick={onGetBundle}
          >
            Get it in the ₹{bundlePrice} Bundle
            <ChevronRight className="size-4" />
          </button>
          <button
            type="button"
            className="store-explore-close-btn"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(modal, document.body);
}
