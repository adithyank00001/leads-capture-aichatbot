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
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { Separator } from "@/components/ui/separator";

export function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    const supabase = createBrowserSupabaseClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (signUpError) {
      setError(getCustomerErrorMessage(signUpError));
      return;
    }

    if (data.session) {
      try {
        await fetch("/api/auth/claim-purchase", { method: "POST" });
      } catch {
        // Claim is retried on dashboard load if webhook is still processing.
      }
      router.push("/checkout");
      router.refresh();
      return;
    }

    setSuccessMessage(
      "Account created. Please check your email and click the confirmation link, then come back here to log in.",
    );
  }

  return (
    <Card className="w-full shadow-lg ring-primary/10">
      <CardHeader>
        <CardTitle className="text-2xl">Create your account</CardTitle>
        <CardDescription>
          Create your account, then unlock lifetime access for your chatbot
          dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <GoogleSignInButton nextPath="/checkout" onError={setError} />
        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">or sign up with email</span>
          <Separator className="flex-1" />
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signup-email">Email</Label>
            <Input
              id="signup-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-password">Password</Label>
            <Input
              id="signup-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={6}
              required
            />
            <p className="text-xs text-muted-foreground">At least 6 characters</p>
          </div>
          {successMessage ? (
            <Alert>
              <AlertDescription className="text-emerald-700">
                {successMessage}
              </AlertDescription>
            </Alert>
          ) : null}
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <Button type="submit" disabled={loading} className="w-full" size="lg">
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
