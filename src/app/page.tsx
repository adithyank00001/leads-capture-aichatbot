import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SalesLandingPage } from "@/components/marketing/sales-landing-page";
import { publicConfig } from "@/lib/config";
import { getHasLifetimeAccessForMarketing } from "@/lib/marketing/access";

export const metadata: Metadata = {
  title: `${publicConfig.appName} — Turn Website Visitors Into Real Estate Leads`,
  description:
    "High-intent prospects visit your website but leave without contacting you. Our AI sales assistant captures their details before they leave, 24/7.",
};

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
