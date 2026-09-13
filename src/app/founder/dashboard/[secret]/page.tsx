import { FounderDashboard } from "@/components/founder/founder-dashboard";
import { FounderLoginForm } from "@/components/founder/founder-login-form";
import {
  assertFounderDashboardSecretOrNotFound,
  hasFounderSession,
} from "@/lib/founder/auth";
import { loadFounderDashboardData } from "@/lib/founder/data";

type PageProps = {
  params: Promise<{ secret: string }>;
};

export default async function FounderDashboardPage({ params }: PageProps) {
  const { secret } = await params;
  assertFounderDashboardSecretOrNotFound(secret);

  const signedIn = await hasFounderSession();

  if (!signedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100 px-4">
        <FounderLoginForm />
      </div>
    );
  }

  const data = await loadFounderDashboardData();

  return (
    <div className="min-h-screen bg-zinc-100">
      <FounderDashboard data={data} />
    </div>
  );
}
