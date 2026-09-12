import type { Metadata } from "next";

import { SalesLandingPage } from "@/components/marketing/sales-landing-page";
import { landingPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = {
  ...landingPageMetadata,
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

/**
 * Marketing home is closed via middleware:
 * guests → /login, customers → /products (or /checkout).
 * Component kept only as a fallback if middleware is bypassed.
 */
export default function HomePage() {
  return <SalesLandingPage />;
}
