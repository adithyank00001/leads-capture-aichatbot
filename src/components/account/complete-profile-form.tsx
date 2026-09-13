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
import { fetchJsonWithTimeout } from "@/lib/api/fetch-client";

type ProfileResponse = {
  ok?: boolean;
  data?: {
    redirectTo?: string;
  };
  error?: {
    message?: string;
  };
};

export function CompleteProfileForm({
  defaultName = "",
  defaultMobile = "",
}: {
  defaultName?: string;
  defaultMobile?: string;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(defaultName);
  const [mobilePhone, setMobilePhone] = useState(defaultMobile);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { response, body } = await fetchJsonWithTimeout<ProfileResponse>(
        "/api/account/profile",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: fullName.trim(),
            mobilePhone: mobilePhone.trim(),
          }),
        },
      );

      if (!response.ok || !body.ok) {
        setError(
          body.error?.message ??
            "Could not save your profile. Please check your details and try again.",
        );
        setLoading(false);
        return;
      }

      router.push(body.data?.redirectTo ?? "/products");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not save your profile. Please try again.",
      );
      setLoading(false);
    }
  }

  return (
    <Card className="w-full shadow-lg ring-primary/10">
      <CardHeader>
        <CardTitle className="text-2xl">Complete your profile</CardTitle>
        <CardDescription>
          Before you can open any product dashboard, enter your name and mobile
          number once. This helps us know who is using the tools.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-full-name">Full name</Label>
            <Input
              id="profile-full-name"
              name="fullName"
              autoComplete="name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Your full name"
              required
              minLength={2}
              maxLength={80}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-mobile">Mobile number</Label>
            <Input
              id="profile-mobile"
              name="mobilePhone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              value={mobilePhone}
              onChange={(event) => setMobilePhone(event.target.value)}
              placeholder="Include country code, e.g. +91 98765 43210"
              required
              minLength={8}
              maxLength={20}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Use a number we can reach you on (WhatsApp is fine).
            </p>
          </div>
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <Button type="submit" disabled={loading} className="w-full" size="lg">
            {loading ? "Saving..." : "Save and continue"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
