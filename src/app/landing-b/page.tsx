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

/** AB-test landing variant — same as home, without the solution demo video. Fully static. */
export default function LandingBPage() {
  return <SalesLandingPage showSolutionVideo={false} />;
}
