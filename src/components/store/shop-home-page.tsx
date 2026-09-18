import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, ChevronRight } from "lucide-react";

import { BrandLogo } from "@/components/marketing/brand-logo";
import { ShopProductCard } from "@/components/store/shop-product-card";
import { shopCatalog } from "@/lib/store/catalog";

function formatMoney(amount: number, symbol: string) {
  const whole = Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
  const [intPart, decPart] = whole.split(".");
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decPart ? `${symbol}${withCommas}.${decPart}` : `${symbol}${withCommas}`;
}

export function ShopHomePage() {
  const featured = shopCatalog.find((p) => p.topSelling) ?? shopCatalog[0];
  const rest = shopCatalog.filter((p) => p.id !== featured.id);

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
            <Link href="/store/product" className="hover:text-[var(--store-ink)]">
              Top selling
            </Link>
            <Link href="#products" className="hidden sm:inline hover:text-[var(--store-ink)]">
              All products
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="shop-hero">
          <div className="store-shell shop-hero-inner">
            <div className="shop-hero-copy">
              <p className="store-eyebrow">Digital products store</p>
              <h1 className="shop-hero-title">Premium lead databases & growth tools</h1>
              <p className="shop-hero-subtitle">
                High quality. High Accuracy. Affordable price
              </p>
              <div className="shop-hero-actions">
                <Link href={featured.href ?? "#products"} className="store-btn-primary shop-hero-btn">
                  Shop top selling
                  <ChevronRight className="size-4" />
                </Link>
                <Link href="#products" className="shop-hero-secondary">
                  Browse all products
                </Link>
              </div>
            </div>

            <Link href={featured.href ?? "#products"} className="shop-hero-feature">
              <div className="shop-hero-feature-media">
                <Image
                  src={featured.image}
                  alt={featured.imageAlt}
                  fill
                  priority
                  sizes="(max-width: 900px) 100vw, 42vw"
                  className="object-contain p-4"
                  unoptimized
                />
                <span className="shop-card-badge shop-card-badge-hot">Top selling</span>
              </div>
              <div className="shop-hero-feature-meta">
                <p className="shop-hero-feature-label">Best seller this week</p>
                <h2>{featured.title}</h2>
                <div className="shop-card-price-row mt-2">
                  <span className="shop-card-price">
                    {formatMoney(featured.price, featured.currencySymbol)}
                  </span>
                  {featured.compareAtPrice != null ? (
                    <span className="shop-card-compare">
                      {formatMoney(featured.compareAtPrice, featured.currencySymbol)}
                    </span>
                  ) : null}
                </div>
              </div>
            </Link>
          </div>
        </section>

        <section id="products" className="shop-products">
          <div className="store-shell">
            <div className="shop-products-head">
              <h2>All products</h2>
              <p>{shopCatalog.length} digital products</p>
            </div>

            <div className="shop-grid">
              <ShopProductCard product={featured} />
              {rest.map((product) => (
                <ShopProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="shop-footer">
        <div className="store-shell flex flex-col gap-2 py-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[var(--store-muted)]">
            Instant digital delivery · Secure checkout
          </p>
          <Link href="/store/product" className="text-sm font-semibold text-[var(--store-ink)]">
            Get the top selling database →
          </Link>
        </div>
      </footer>
    </div>
  );
}
