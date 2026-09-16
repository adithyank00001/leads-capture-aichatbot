import { TrialShell } from "@/components/trial/trial-shell";

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function TrialPage({ params }: PageProps) {
  const { token } = await params;
  const safeToken = decodeURIComponent(token ?? "").trim();

  return <TrialShell token={safeToken} />;
}
