import type { Metadata } from "next";

import { SalesLandingPage } from "@/components/marketing/sales-landing-page";
import { getHasLifetimeAccessForMarketing } from "@/lib/marketing/access";

export const metadata: Metadata = {
  title: "Generate More Qualified Student Leads With a 24/7 AI Counselor",
  description:
    "Turn anonymous website visitors into qualified student leads. Your AI counselor answers questions, qualifies students, and captures their contact details 24/7 — built for study abroad agencies and consultants.",
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
