"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { ZoomIn } from "lucide-react";

import { cloudinaryDeliveryUrl } from "@/lib/store/cloudinary";
import type { StoreIncludedImage } from "@/lib/store/product-content";

const ProductImageZoomLightbox = dynamic(
  () =>
    import("@/components/store/product-image-zoom-lightbox").then(
      (m) => m.ProductImageZoomLightbox,
    ),
  { ssr: false },
);

function prefetchZoomLightbox() {
  void import("@/components/store/product-image-zoom-lightbox");
}

type Props = {
  images: Array<StoreIncludedImage | string>;
};

export function ProductIncludedImages({ images }: Props) {
  const [activeZoomIndex, setActiveZoomIndex] = useState<number | null>(null);

  if (!images || images.length === 0) return null;

  const normalizedImages = images.map((img, idx) => ({
    src: typeof img === "string" ? img : img.src,
    alt:
      (typeof img === "object" && img.alt) ||
      `What's included preview ${idx + 1}`,
  }));

  const activeImage =
    activeZoomIndex !== null ? normalizedImages[activeZoomIndex] : null;

  return (
    <>
      <div className="store-included-images">
        {normalizedImages.map((img, idx) => (
          <button
            key={img.src || idx}
            type="button"
            className="store-included-image-card"
            onClick={() => setActiveZoomIndex(idx)}
            onPointerEnter={prefetchZoomLightbox}
            onFocus={prefetchZoomLightbox}
            aria-label={`Zoom preview image ${idx + 1}: ${img.alt}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cloudinaryDeliveryUrl(img.src, {
                width: 1200,
                quality: "good",
              })}
              alt={img.alt}
              className="store-included-image"
              loading="lazy"
              decoding="async"
            />
            <span className="store-zoom-cue">
              <ZoomIn className="size-3.5" />
              Click to zoom
            </span>
          </button>
        ))}
      </div>

      {activeImage && activeZoomIndex !== null ? (
        <ProductImageZoomLightbox
          src={activeImage.src}
          alt={activeImage.alt}
          deliveryWidth={2000}
          onClose={() => setActiveZoomIndex(null)}
          onPrev={
            normalizedImages.length > 1
              ? () =>
                  setActiveZoomIndex((prev) =>
                    prev !== null
                      ? (prev - 1 + normalizedImages.length) %
                        normalizedImages.length
                      : 0,
                  )
              : undefined
          }
          onNext={
            normalizedImages.length > 1
              ? () =>
                  setActiveZoomIndex((prev) =>
                    prev !== null ? (prev + 1) % normalizedImages.length : 0,
                  )
              : undefined
          }
        />
      ) : null}
    </>
  );
}

