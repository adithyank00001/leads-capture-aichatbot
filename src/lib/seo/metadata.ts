import type { Metadata } from "next";

export const landingPageTitle =
  "Generate Fresh B2B Leads in 30 Seconds | growscalex";

export const landingPageDescription =
  "Stop buying dead databases and paying monthly fees. Get the fastest, easiest, most affordable B2B lead generation software. Fresh leads in 30 seconds. Lifetime access for just ₹999.";

export const landingPageMetadata: Metadata = {
  title: {
    absolute: landingPageTitle,
  },
  description: landingPageDescription,
  openGraph: {
    title: landingPageTitle,
    description: landingPageDescription,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: landingPageTitle,
    description: landingPageDescription,
  },
};
