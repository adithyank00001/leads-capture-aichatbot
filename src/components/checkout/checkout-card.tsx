"use client";

import { useState } from "react";

import { FormattedPrice } from "@/components/ui/formatted-price";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { publicConfig } from "@/lib/config";

type CheckoutResponse =
  | {
      ok: true;
      data: {
        checkoutUrl?: string;
        alreadyPaid?: boolean;
        redirectUrl?: string;
      };
    }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
      };
    };

const CHECKOUT_ERROR_MESSAGES: Record<string, string> = {
  missing_email:
    "Your account needs an email address before you can pay. Please sign up with email or Google again.",
  checkout_failed: "Could not start checkout. Please try again in a moment.",
  dodo_not_configured:
    "Payments are not configured yet. Please contact support.",
  dodo_product_not_configured:
    "The lifetime access product is not configured yet. Please contact support.",
};

type CheckoutCardProps = {
  errorCode?: string | null;
};

export function CheckoutCard({ errorCode }: CheckoutCardProps) {
  const [error, setError] = useState<string | null>(
    errorCode
      ? (CHECKOUT_ERROR_MESSAGES[errorCode] ??
        "Could not start checkout. Please try again.")
      : null,
  );
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
      });
      const body = (await response.json()) as CheckoutResponse;

      if (!body.ok) {
        setError(body.error.message);
        return;
      }

      if (body.data.alreadyPaid && body.data.redirectUrl) {
        window.location.assign(body.data.redirectUrl);
        return;
      }

      if (body.data.checkoutUrl) {
        window.location.assign(body.data.checkoutUrl);
        return;
      }

      setError("Could not start checkout. Please try again.");
    } catch {
      setError("Could not start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-lg shadow-lg ring-primary/10">
      <CardHeader className="space-y-3">
        <CardTitle className="text-3xl">Lifetime access</CardTitle>
        <CardDescription>
          Pay once, use {publicConfig.appName} forever. No monthly fees.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-xl border bg-muted/40 p-5">
          <p className="text-sm text-muted-foreground">One-time payment</p>
          <p className="mt-1 text-4xl font-bold tracking-tight">
            <FormattedPrice amount={publicConfig.lifetimeAccessPriceUsd} />
          </p>
        </div>

        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>AI chatbot for your website</li>
          <li>Lead capture dashboard</li>
          <li>Website knowledge import</li>
          <li>Lifetime updates included</li>
        </ul>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <Button
          type="button"
          size="lg"
          className="w-full"
          disabled={loading}
          onClick={handleCheckout}
        >
          {loading ? (
            "Starting checkout..."
          ) : (
            <span className="inline-flex flex-wrap items-center justify-center gap-x-1">
              Pay{" "}
              <FormattedPrice amount={publicConfig.lifetimeAccessPriceUsd} /> —
              get lifetime access
            </span>
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Secure checkout powered by Dodo Payments.
        </p>
      </CardContent>
    </Card>
  );
}
