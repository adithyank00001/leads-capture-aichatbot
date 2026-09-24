import { ProductDetails } from "@/components/store/product-details";
import { ProductHeader } from "@/components/store/product-header";
import { ProductHero } from "@/components/store/product-hero";
import type { StoreProductConfig } from "@/lib/store/product-content";

export function StoreProductPage({ product }: { product: StoreProductConfig }) {
  return (
    <div className="store-root min-h-full">
      <ProductHeader brandName={product.brandName} />
      <main className="store-shell py-8 sm:py-12 lg:py-16">
        <ProductHero product={product} />
        <ProductDetails product={product} />
      </main>
    </div>
  );
}
