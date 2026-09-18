"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, Star, X } from "lucide-react";

import type { CatalogProduct } from "@/lib/store/catalog";
import { cn } from "@/lib/utils";

function formatMoney(amount: number, symbol: string) {
  const whole = Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
  const [intPart, decPart] = whole.split(".");
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decPart ? `${symbol}${withCommas}.${decPart}` : `${symbol}${withCommas}`;
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i + 1 <= Math.round(rating);
        return (
          <Star
            key={i}
            className={cn(
              "size-3",
              filled ? "fill-[var(--store-ink)] text-[var(--store-ink)]" : "text-[var(--store-line)]",
            )}
          />
        );
      })}
    </div>
  );
}

export function ShopProductCard({ product }: { product: CatalogProduct }) {
  const [showOutOfStock, setShowOutOfStock] = useState(false);

  useEffect(() => {
    if (!showOutOfStock) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setShowOutOfStock(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showOutOfStock]);

  const inner = (
    <>
      <div className="shop-card-media">
        <Image
          src={product.image}
          alt={product.imageAlt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className={cn("object-contain p-3", !product.available && "opacity-70")}
          unoptimized
        />
        {product.badge ? (
          <span
            className={cn(
              "shop-card-badge",
              product.topSelling && "shop-card-badge-hot",
              !product.available && "shop-card-badge-oos",
            )}
          >
            {product.badge}
          </span>
        ) : null}
      </div>

      <div className="shop-card-body">
        <div className="mb-2 flex items-center gap-2">
          <Stars rating={product.rating} />
          <span className="text-xs text-[var(--store-muted)]">
            {product.rating.toFixed(1)} · {product.reviewCount}+
          </span>
        </div>
        <h3 className="shop-card-title">{product.title}</h3>
        <p className="shop-card-subtitle">{product.subtitle}</p>
        <div className="shop-card-price-row">
          <span className="shop-card-price">
            {formatMoney(product.price, product.currencySymbol)}
          </span>
          {product.compareAtPrice != null ? (
            <span className="shop-card-compare">
              {formatMoney(product.compareAtPrice, product.currencySymbol)}
            </span>
          ) : null}
        </div>
        <span className={cn("shop-card-cta", !product.available && "is-muted")}>
          {product.available ? (
            <>
              View product <ChevronRight className="size-4" />
            </>
          ) : (
            "Out of stock"
          )}
        </span>
      </div>
    </>
  );

  if (product.href && product.available) {
    return (
      <Link
        href={product.href}
        className={cn("shop-card", product.topSelling && "shop-card-featured")}
      >
        {inner}
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        className={cn("shop-card shop-card-oos", product.topSelling && "shop-card-featured")}
        onClick={() => setShowOutOfStock(true)}
      >
        {inner}
      </button>

      {showOutOfStock ? (
        <div
          className="shop-oos-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Out of stock"
          onClick={() => setShowOutOfStock(false)}
        >
          <div className="shop-oos-modal" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="shop-oos-close"
              aria-label="Close"
              onClick={() => setShowOutOfStock(false)}
            >
              <X className="size-4" />
            </button>
            <p className="shop-oos-eyebrow">Out of stock</p>
            <h3>{product.title}</h3>
            <p>
              This product is currently out of stock. Check the top selling database
              instead — it&apos;s available now.
            </p>
            <Link
              href="/store/product"
              className="store-btn-primary shop-oos-btn"
              onClick={() => setShowOutOfStock(false)}
            >
              View top selling product
              <ChevronRight className="size-4" />
            </Link>
          </div>
        </div>
      ) : null}
    </>
  );
}
