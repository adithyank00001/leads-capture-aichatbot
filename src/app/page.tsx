import type { Metadata } from "next";

import { SalesLandingPage } from "@/components/marketing/sales-landing-page";
import { landingPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = landingPageMetadata;

/** Public Meta ads landing — fully static (no auth / cookie checks). */
export default function HomePage() {
  return <SalesLandingPage />;
}
