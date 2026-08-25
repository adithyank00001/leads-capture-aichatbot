import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { MetaPixelPurchase } from "@/components/meta-pixel-purchase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCustomerAccess } from "@/lib/auth/access";
import { getCustomerByUserId } from "@/lib/db/customers";
import { getDodoConfig } from "@/lib/billing/dodo-config";
import { serverEnv } from "@/lib/env.server";
import { sendPurchaseEventFromPageRequest } from "@/lib/meta/capi";
import { metaCustomerInfoFromDodo } from "@/lib/meta/user-data";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import DodoPayments from "dodopayments";

async function loadPurchaseCustomerInfo(
  paymentId: string,
  fallbackEmail: string | null,
  fallbackUserId?: string | null,
) {
  try {
    const dodo = getDodoConfig();
    const client = new DodoPayments({
      bearerToken: dodo.apiKey,
      environment: dodo.environment,
    });
    const payment = await client.payments.retrieve(paymentId);
    const name =
      typeof payment.customer?.name === "string" ? payment.customer.name : null;
    const cardHolderName =
      typeof payment.card_holder_name === "string"
        ? payment.card_holder_name
        : null;
    const dodoCustomerId =
      typeof payment.customer?.customer_id === "string"
        ? payment.customer.customer_id
        : null;
    const userIdFromMetadata =
      typeof payment.metadata?.user_id === "string"
        ? payment.metadata.user_id
        : null;

    return metaCustomerInfoFromDodo({
      email: fallbackEmail ?? payment.customer?.email ?? null,
      name,
      cardHolderName,
      billing: payment.billing ?? null,
      dodoCustomerId,
      userId: userIdFromMetadata ?? fallbackUserId ?? null,
    });
  } catch {
    return fallbackEmail
      ? metaCustomerInfoFromDodo({
          email: fallbackEmail,
          userId: fallbackUserId ?? null,
        })
      : fallbackUserId
        ? metaCustomerInfoFromDodo({ userId: fallbackUserId })
        : null;
  }
}

export default async function CheckoutSuccessPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const client = supabase as SupabaseClient<Database>;
  const access = await getCustomerAccess(client, user.id);

  if (access.hasLifetimeAccess) {
    const customer = await getCustomerByUserId(client, user.id);
    const paymentEventId = customer?.dodo_payment_id?.trim() || null;

    if (paymentEventId) {
      const requestHeaders = await headers();
      const appOrigin = serverEnv.appUrl.replace(/\/+$/, "");
      const email = user.email ?? customer?.email ?? null;
      const customerInfo = await loadPurchaseCustomerInfo(
        paymentEventId,
        email,
        user.id,
      );
      await sendPurchaseEventFromPageRequest({
        paymentId: paymentEventId,
        email,
        customer: customerInfo,
        eventSourceUrl: `${appOrigin}/checkout/success`,
        requestHeaders,
      });
    }

    return (
      <div className="relative min-h-screen bg-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.52_0.19_252/0.12),transparent_55%)]" />
        <div className="relative mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-4 py-10">
          <Card className="w-full max-w-lg shadow-lg ring-primary/10">
            <CardHeader>
              <CardTitle className="text-2xl">Payment successful</CardTitle>
              <CardDescription>
                Your account is unlocked. Welcome to lifetime access.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full" size="lg">
                <Link href="/dashboard">Go to dashboard</Link>
              </Button>
              {paymentEventId ? (
                <MetaPixelPurchase eventId={paymentEventId} />
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.52_0.19_252/0.12),transparent_55%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-4 py-10">
        <Card className="w-full max-w-lg shadow-lg ring-primary/10">
          <CardHeader>
            <CardTitle className="text-2xl">Payment received</CardTitle>
            <CardDescription>
              We are confirming your payment now. Click refresh below in a few
              seconds once payment is processed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild variant="outline" className="w-full" size="lg">
              <Link href="/checkout/success">Refresh now</Link>
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              If this takes more than a minute, contact support with your
              payment receipt.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
