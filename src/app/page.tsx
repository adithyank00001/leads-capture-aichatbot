import type { Metadata } from "next";

import { SalesLandingPage } from "@/components/marketing/sales-landing-page";
import { publicConfig } from "@/lib/config";
import { getHasLifetimeAccessForMarketing } from "@/lib/marketing/access";

export const metadata: Metadata = {
  title: `${publicConfig.appName} — Turn Website Visitors Into Real Estate Leads`,
  description:
    "High-intent prospects visit your website but leave without contacting you. Our AI sales assistant captures their details before they leave, 24/7.",
};

export default async function HomePage() {
  const hasLifetimeAccess = await getHasLifetimeAccessForMarketing();

  return <SalesLandingPage hasLifetimeAccess={hasLifetimeAccess} />;
}
