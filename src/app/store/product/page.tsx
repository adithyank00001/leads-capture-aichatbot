import type { Metadata } from "next";

import { StoreProductPage } from "@/components/store/product-page";
import { storeProduct } from "@/lib/store/product-content";

export const metadata: Metadata = {
  title: {
    absolute: "110Cr+ PAN India Leads Database 2026 | growscaleX",
  },
  description:
    "Unlock 110 Crore+ verified Indian contacts across 200+ categories. Instant Google Drive download plus USA leads bonus. Secure checkout from ₹397.",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    title: "110Cr+ PAN India Leads Database 2026 | growscaleX",
    description:
      "110 Crore+ verified Indian contacts across 200+ categories. Instant download + USA leads bonus.",
    type: "website",
    images: storeProduct.images[0]
      ? [{ url: storeProduct.images[0].src, alt: storeProduct.images[0].alt }]
      : undefined,
  },
  twitter: {
    card: "summary_large_image",
    title: "110Cr+ PAN India Leads Database 2026 | growscaleX",
    description:
      "110 Crore+ verified Indian contacts. Instant download + USA leads bonus. From ₹397.",
    images: storeProduct.images[0] ? [storeProduct.images[0].src] : undefined,
  },
};

export default function StoreProductRoutePage() {
  return <StoreProductPage product={storeProduct} />;
}
