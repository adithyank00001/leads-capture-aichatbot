import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SalesLandingPage } from "@/components/marketing/sales-landing-page";
import { getHasLifetimeAccessForMarketing } from "@/lib/marketing/access";
import { landingPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = landingPageMetadata;

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const code = typeof params.code === "string" ? params.code : null;

  // Safety net: if OAuth lands on "/" with ?code=..., finish login at /auth/callback.
  if (code) {
    const callbackParams = new URLSearchParams({ code });
    redirect(`/auth/callback?${callbackParams.toString()}`);
  }

  const hasLifetimeAccess = await getHasLifetimeAccessForMarketing();

  return <SalesLandingPage hasLifetimeAccess={hasLifetimeAccess} />;
}
