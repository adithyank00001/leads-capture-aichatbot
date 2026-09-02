import type { Metadata } from "next";

import { SalesLandingPage } from "@/components/marketing/sales-landing-page";
import { getHasLifetimeAccessForMarketing } from "@/lib/marketing/access";
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

/** AB-test landing variant — same page as home, without the solution demo video. Not indexed by Google. */
export default async function LandingBPage() {
  const hasLifetimeAccess = await getHasLifetimeAccessForMarketing();

  return (
    <SalesLandingPage
      hasLifetimeAccess={hasLifetimeAccess}
      showSolutionVideo={false}
    />
  );
}
