import Link from "next/link";
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
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

export default async function CheckoutSuccessPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const access = await getCustomerAccess(
    supabase as SupabaseClient<Database>,
    user.id,
  );

  if (access.hasLifetimeAccess) {
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
              <MetaPixelPurchase />
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
