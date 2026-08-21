import type { Metadata } from "next";

import { SalesLandingPage } from "@/components/marketing/sales-landing-page";
import { publicConfig } from "@/lib/config";
import { getHasLifetimeAccessForMarketing } from "@/lib/marketing/access";

export const metadata: Metadata = {
  title: `${publicConfig.appName} — Turn Website Visitors Into Real Estate Leads`,
  description:
    "High-intent prospects visit your website but leave without contacting you. Our AI sales assistant captures their details before they leave, 24/7.",
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
