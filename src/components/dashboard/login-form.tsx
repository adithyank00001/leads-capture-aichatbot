"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleSignInButton } from "@/components/dashboard/google-sign-in-button";
import { getCustomerErrorMessage } from "@/lib/dashboard/customer-errors";
import { getSafeOAuthNextPath } from "@/lib/auth/oauth";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { Separator } from "@/components/ui/separator";

type LoginFormProps = {
  nextPath?: string;
  authError?: string;
};

export function LoginForm({ nextPath, authError }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    authError === "auth_callback_failed"
      ? "Google sign-in could not be completed. Please try again."
      : authError === "google_oauth_failed"
        ? "Could not start Google sign-in. Please try again or use email instead."
        : null,
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createBrowserSupabaseClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(getCustomerErrorMessage(signInError));
      return;
    }

    router.push(getSafeOAuthNextPath(nextPath));
    router.refresh();
  }

  return (
    <Card className="w-full shadow-lg ring-primary/10">
      <CardHeader>
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Sign in to manage your chatbot and leads.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <GoogleSignInButton nextPath={nextPath} onError={setError} />
        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">or sign in with email</span>
          <Separator className="flex-1" />
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">Password</Label>
            <Input
              id="login-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <Button type="submit" disabled={loading} className="w-full" size="lg">
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
