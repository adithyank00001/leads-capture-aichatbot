import Link from "next/link";

import { LoginForm } from "@/components/dashboard/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-zinc-100 px-4 py-10">
      <LoginForm />
      <p className="mx-auto mt-4 max-w-md text-sm text-zinc-600">
        No account?{" "}
        <Link href="/signup" className="underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
