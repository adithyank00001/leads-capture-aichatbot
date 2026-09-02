import type { Metadata } from "next";

export const landingPageTitle =
  "Generate More Qualified Student Leads With a 24/7 AI Counselor";

export const landingPageDescription =
  "Turn anonymous website visitors into qualified student leads. Your AI counselor answers questions, qualifies students, and captures their contact details 24/7 — built for study abroad agencies and consultants.";

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
