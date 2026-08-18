import Link from "next/link";

import { SignupForm } from "@/components/dashboard/signup-form";

type SignupPageProps = {
  searchParams: Promise<{
    email?: string;
  }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { email } = await searchParams;

  return (
    <div className="relative flex min-h-screen w-full flex-1 bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.52_0.19_252/0.12),transparent_55%)]" />
      <div className="relative mx-auto flex w-full min-h-screen max-w-md flex-col justify-center px-4 py-10 sm:px-6">
        <SignupForm defaultEmail={email} nextPath="/dashboard" />
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
