import type { Metadata } from "next";

import { SalesLandingPage } from "@/components/marketing/sales-landing-page";
import { publicConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: {
    absolute: `Legacy Landing — ${publicConfig.appName}`,
  },
  description: "Hidden legacy marketing page.",
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
 * Old AI counsellor sales landing — kept for internal use.
 * Public access is blocked in middleware (guests → /login).
 */
export default function LandingOldPage() {
  return <SalesLandingPage />;
}
