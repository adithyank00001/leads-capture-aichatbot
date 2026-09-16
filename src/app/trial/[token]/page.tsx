import type { Metadata } from "next";

import { TrialShell } from "@/components/trial/trial-shell";

const TRIAL_OG_TITLE =
  "Get a taste of our unlimited B2B lead generation software";

const TRIAL_OG_DESCRIPTION =
  "Try growscalex free — search real B2B leads with no login. Limited trial preview.";

const TRIAL_OG_IMAGE = {
  url: "/og-trial.jpg",
  width: 1920,
  height: 1080,
  alt: "growscalex — See Your Next 100 Clients",
} as const;

type PageProps = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: {
      absolute: TRIAL_OG_TITLE,
    },
    description: TRIAL_OG_DESCRIPTION,
    openGraph: {
      title: TRIAL_OG_TITLE,
      description: TRIAL_OG_DESCRIPTION,
      type: "website",
      images: [TRIAL_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: TRIAL_OG_TITLE,
      description: TRIAL_OG_DESCRIPTION,
      images: [TRIAL_OG_IMAGE.url],
    },
  };
}

export default async function TrialPage({ params }: PageProps) {
  const { token } = await params;
  const safeToken = decodeURIComponent(token ?? "").trim();

  return <TrialShell token={safeToken} />;
}
