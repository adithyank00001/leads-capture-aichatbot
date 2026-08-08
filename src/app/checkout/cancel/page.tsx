import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function CheckoutCancelPage() {
  return (
    <div className="relative min-h-screen bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.52_0.19_252/0.12),transparent_55%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-4 py-10">
        <Card className="w-full max-w-lg shadow-lg ring-primary/10">
          <CardHeader>
            <CardTitle className="text-2xl">Payment cancelled</CardTitle>
            <CardDescription>
              No worries — you can try again whenever you are ready.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" size="lg">
              <Link href="/checkout">Back to checkout</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
