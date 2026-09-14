import type { Metadata } from "next";

import { B2bLeadsLandingPage } from "@/components/marketing/b2b-leads-landing-page";
import { getHasLifetimeAccessForMarketing } from "@/lib/marketing/access";
import { landingPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = {
  ...landingPageMetadata,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default async function HomePage() {
  const hasLifetimeAccess = await getHasLifetimeAccessForMarketing();

  return <B2bLeadsLandingPage hasLifetimeAccess={hasLifetimeAccess} />;
}
