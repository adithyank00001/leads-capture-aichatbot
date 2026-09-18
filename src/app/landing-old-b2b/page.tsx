import type { Metadata } from "next";

import { B2bLeadsLandingPage } from "@/components/marketing/b2b-leads-landing-page";
import { getHasLifetimeAccessForMarketing } from "@/lib/marketing/access";
import { publicConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: {
    absolute: `Archived B2B Landing — ${publicConfig.appName}`,
  },
  description: "Hidden archived B2B marketing page.",
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
 * Previous public homepage (B2B leads landing).
 * Archived so the shop homepage can live on `/`.
 */
export default async function LandingOldB2bPage() {
  const hasLifetimeAccess = await getHasLifetimeAccessForMarketing();
  return <B2bLeadsLandingPage hasLifetimeAccess={hasLifetimeAccess} />;
}
