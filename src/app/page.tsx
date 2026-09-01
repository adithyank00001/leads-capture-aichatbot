import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SalesLandingPage } from "@/components/marketing/sales-landing-page";
import { getHasLifetimeAccessForMarketing } from "@/lib/marketing/access";

export const metadata: Metadata = {
  title: "Generate More Qualified Student Leads With a 24/7 AI Counselor",
  description:
    "Turn anonymous website visitors into qualified student leads. Your AI counselor answers questions, qualifies students, and captures their contact details 24/7 — built for study abroad agencies and consultants.",
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
