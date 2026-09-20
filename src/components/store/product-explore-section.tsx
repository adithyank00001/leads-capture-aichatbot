"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import { ProductImage } from "@/components/store/product-image";
import { ProductStars } from "@/components/store/product-stars";
import { shopCatalog, type CatalogProduct } from "@/lib/store/catalog";
import { formatMoney } from "@/lib/store/product-format";

const EXPLORE_PRODUCT_IDS = [
  "usa-leads-premium",
  "real-estate-leads",
  "crm-blueprint",
] as const;

const exploreProducts = shopCatalog.filter((item) =>
  (EXPLORE_PRODUCT_IDS as readonly string[]).includes(item.id),
);

const ProductExploreModal = dynamic(
  () =>
    import("@/components/store/product-explore-modal").then(
      (m) => m.ProductExploreModal,
    ),
  { ssr: false },
);

function prefetchExploreModal() {
  void import("@/components/store/product-explore-modal");
}

export function ProductExploreSection({ bundlePrice }: { bundlePrice: number }) {
  const [exploreProduct, setExploreProduct] = useState<CatalogProduct | null>(
    null,
  );

  if (exploreProducts.length === 0) return null;

  return (
    <>
      <section
        className="store-explore"
        aria-label="Explore Individual Databases"
      >
        <h2>Explore Individual Databases</h2>
        <p className="store-explore-note">
          Prefer a single niche database? Browse these standalone options below.
        </p>
        <div className="store-explore-grid">
          {exploreProducts.map((item) => (
            <button
              key={item.id}
              type="button"
              className="store-explore-card"
              onClick={() => setExploreProduct(item)}
              onPointerEnter={prefetchExploreModal}
              onFocus={prefetchExploreModal}
            >
              <div className="store-explore-card-media">
                <ProductImage
                  src={item.image}
                  alt={item.imageAlt}
                  sizes="(max-width: 640px) 90vw, 280px"
                  fit="cover"
                  width={360}
                />
              </div>
              <div className="store-explore-card-body">
                <p className="store-explore-card-title">{item.title}</p>
                <p className="store-explore-card-sub">{item.subtitle}</p>
                <div className="store-explore-card-rating">
                  <ProductStars rating={item.rating} />
                  <span>
                    {item.rating.toFixed(1)} ·{" "}
                    {Math.floor(item.reviewCount / 10) * 10}+ customers
                  </span>
                </div>
                <p className="store-explore-card-price">
                  {formatMoney(item.price, item.currencySymbol)}
                  {item.compareAtPrice != null ? (
                    <span className="store-explore-card-was">
                      {formatMoney(item.compareAtPrice, item.currencySymbol)}
                    </span>
                  ) : null}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {exploreProduct ? (
        <ProductExploreModal
          exploreProduct={exploreProduct}
          bundlePrice={bundlePrice}
          onClose={() => setExploreProduct(null)}
          onGetBundle={() => {
            setExploreProduct(null);
            document
              .getElementById("buy")
              ?.scrollIntoView({ behavior: "smooth", block: "center" });
          }}
        />
      ) : null}
    </>
  );
}
