import { ProductDetails } from "@/components/store/product-details";
import { ProductExploreSection } from "@/components/store/product-explore-section";
import { ProductHeader } from "@/components/store/product-header";
import { ProductHero } from "@/components/store/product-hero";
import type { StoreProductContent } from "@/lib/store/product-content";

export function StoreProductPage({ product }: { product: StoreProductContent }) {
  return (
    <div className="store-root min-h-full">
      <ProductHeader brandName={product.brandName} />
      <main className="store-shell py-8 sm:py-12 lg:py-16">
        <ProductHero product={product} />
        <ProductDetails product={product}>
          <ProductExploreSection bundlePrice={product.price} />
        </ProductDetails>
      </main>
    </div>
  );
}
