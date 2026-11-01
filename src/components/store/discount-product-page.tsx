import { DiscountProductHero } from "@/components/store/discount-product-hero";
import { ProductDetails } from "@/components/store/product-details";
import { ProductHeader } from "@/components/store/product-header";
import type { StoreProductConfig } from "@/lib/store/product-content";

/**
 * Isolated product page for the ₹297 discount duplicate of the PAN India Leads product.
 * Uses DiscountProductHero to show "100Rs additional Off applied" and "Valid for 24 hours" tags.
 */
export function DiscountProductPage({
  product,
}: {
  product: StoreProductConfig;
}) {
  return (
    <div className="store-root min-h-full">
      <ProductHeader brandName={product.brandName} />
      <main className="store-shell py-8 sm:py-12 lg:py-16">
        <DiscountProductHero product={product} />
        <ProductDetails product={product} />
      </main>
    </div>
  );
}

