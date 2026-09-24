import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { StoreProductPage } from "@/components/store/product-page";
import {
  getStoreProductBySlug,
  LIVE_ADS_PRODUCT_SLUG,
  storeProducts,
} from "@/lib/store/products";

type Props = {
  params: Promise<{ slug: string }>;
};

/** Live ads product is served only at /store/product, never here. */
function getSlugProduct(slug: string) {
  if (slug === LIVE_ADS_PRODUCT_SLUG) {
    return null;
  }
  return getStoreProductBySlug(slug);
}

export const dynamicParams = false;

export function generateStaticParams() {
  return storeProducts
    .filter((product) => product.slug !== LIVE_ADS_PRODUCT_SLUG)
    .map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = getSlugProduct(slug);
  if (!product) {
    return {};
  }

  const image = product.images[0];
  // Draft products stay out of Google until published.
  const indexable = product.published;

  return {
    title: { absolute: `${product.title} | growscaleX` },
    description: product.subtitle,
    robots: {
      index: indexable,
      follow: indexable,
      googleBot: { index: indexable, follow: indexable },
    },
    openGraph: {
      title: `${product.title} | growscaleX`,
      description: product.subtitle,
      type: "website",
      images: image ? [{ url: image.src, alt: image.alt }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.title} | growscaleX`,
      description: product.subtitle,
      images: image ? [image.src] : undefined,
    },
  };
}

export default async function StoreSlugProductPage({ params }: Props) {
  const { slug } = await params;
  const product = getSlugProduct(slug);
  if (!product) {
    notFound();
  }
  return <StoreProductPage product={product} />;
}
