import Link from "next/link";

import { SignupForm } from "@/components/dashboard/signup-form";

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-zinc-100 px-4 py-10">
      <SignupForm />
      <p className="mx-auto mt-4 max-w-md text-sm text-zinc-600">
        Already have an account?{" "}
        <Link href="/login" className="underline">
          Login
        </Link>
      </p>
    </div>
  );
}
