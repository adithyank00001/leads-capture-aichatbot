import Link from "next/link";
import { BadgeCheck } from "lucide-react";

import { BrandLogo } from "@/components/marketing/brand-logo";
import { ShopProductCard } from "@/components/store/shop-product-card";
import { shopCatalog } from "@/lib/store/catalog";

export function ShopHomePage() {
  return (
    <div className="store-root shop-home min-h-full">
      <header className="store-header">
        <div className="store-shell flex h-14 items-center justify-between sm:h-16">
          <div className="store-header-brand">
            <BrandLogo href="/" size="xs" className="store-header-logo" />
            <span className="store-brand store-verified-badge">
              <BadgeCheck className="size-4 shrink-0" aria-hidden />
              Verified Seller
            </span>
          </div>
          <nav className="flex items-center gap-4 text-sm text-[var(--store-muted)]">
            <Link href="#products" className="hover:text-[var(--store-ink)]">
              All products
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="shop-hero">
          <div className="store-shell shop-hero-inner shop-hero-inner-simple">
            <div className="shop-hero-copy">
              <p className="store-eyebrow">Digital products store</p>
              <h1 className="shop-hero-title">
                Premium lead databases & growth tools
              </h1>
              <p className="shop-hero-subtitle">
                High quality. High Accuracy. Affordable price
              </p>
            </div>
          </div>
        </section>

        <section id="products" className="shop-products">
          <div className="store-shell">
            <div className="shop-products-head">
              <h2>All products</h2>
              <p>{shopCatalog.length} digital products</p>
            </div>

            <div className="shop-grid">
              {shopCatalog.map((product) => (
                <ShopProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="shop-footer">
        <div className="store-shell flex flex-col gap-4 py-8">
          <p className="text-sm text-[var(--store-muted)]">
            Instant digital delivery · Secure checkout
          </p>
          <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-[var(--store-muted)]">
            <Link
              href="/privacy-policy"
              className="hover:text-[var(--store-ink)] hover:underline"
            >
              Privacy
            </Link>
            <Link
              href="/terms-of-service"
              className="hover:text-[var(--store-ink)] hover:underline"
            >
              Terms
            </Link>
            <Link
              href="/refund-policy"
              className="hover:text-[var(--store-ink)] hover:underline"
            >
              Refunds
            </Link>
            <Link
              href="/contact"
              className="hover:text-[var(--store-ink)] hover:underline"
            >
              Contact
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
