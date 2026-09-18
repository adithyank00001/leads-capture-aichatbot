import Link from "next/link";
import { headers } from "next/headers";

import { MetaPixelPurchase } from "@/components/meta-pixel-purchase";
import { sendPurchaseEventFromPageRequest } from "@/lib/meta/capi";
import { STORE_DOWNLOAD_FILE } from "@/lib/store/download";
import { getPaidPurchaseByDownloadToken } from "@/lib/store/purchases";
import { storeProduct } from "@/lib/store/product-content";
import { serverEnv } from "@/lib/env.server";

type Props = {
  searchParams: Promise<{ token?: string }>;
};

export default async function StoreSuccessPage({ searchParams }: Props) {
  const params = await searchParams;
  const token = params.token?.trim() ?? "";
  const purchase = token ? await getPaidPurchaseByDownloadToken(token) : null;
  const requestHeaders = await headers();

  if (purchase?.razorpay_payment_id) {
    const origin = serverEnv.appUrl.replace(/\/+$/, "") || "http://localhost:3000";
    const value = purchase.amount_paise / 100;
    await sendPurchaseEventFromPageRequest({
      paymentId: purchase.razorpay_payment_id,
      email: purchase.customer_email,
      customer: {
        email: purchase.customer_email,
        fullName: purchase.customer_name,
      },
      eventSourceUrl: `${origin}/store/success`,
      requestHeaders,
      customData: {
        value,
        currency: (purchase.currency || "INR").toUpperCase(),
        order_id: purchase.razorpay_order_id,
        content_ids: [purchase.product_slug],
        content_name: purchase.product_title,
        content_type: "product",
        num_items: purchase.quantity,
      },
    });
  }

  return (
    <div className="store-root min-h-full">
      {purchase?.razorpay_payment_id ? (
        <MetaPixelPurchase
          eventId={purchase.razorpay_payment_id}
          value={purchase.amount_paise / 100}
          currency={(purchase.currency || "INR").toUpperCase()}
          contentName={purchase.product_title}
          contentIds={[purchase.product_slug]}
          numItems={purchase.quantity}
        />
      ) : null}
      <main className="store-shell flex min-h-[70vh] items-center py-16">
        <div className="mx-auto w-full max-w-xl rounded-[1.5rem] border border-[var(--store-line)] bg-white p-8 shadow-[var(--store-shadow)] sm:p-10">
          {purchase ? (
            <>
              <p className="store-eyebrow">Payment successful</p>
              <h1 className="store-title text-[2rem]">You can download now</h1>
              <p className="mt-3 text-[var(--store-muted)]">
                Thanks for buying <strong>{purchase.product_title}</strong>. Your
                payment is confirmed.
              </p>

              <div className="mt-8 space-y-3">
                <a
                  className="store-btn-primary"
                  href={`/api/store/download?token=${encodeURIComponent(token)}`}
                >
                  Download {STORE_DOWNLOAD_FILE.fileName}
                </a>
                <Link href="/store/product" className="store-btn-secondary">
                  Back to product
                </Link>
              </div>

              <p className="mt-6 text-xs text-[var(--store-muted)]">
                Payment ID: {purchase.razorpay_payment_id}
              </p>
            </>
          ) : (
            <>
              <p className="store-eyebrow">Download locked</p>
              <h1 className="store-title text-[2rem]">Payment not found</h1>
              <p className="mt-3 text-[var(--store-muted)]">
                We could not find a paid order for this link. Please complete
                checkout on the product page first.
              </p>
              <div className="mt-8">
                <Link href="/store/product" className="store-btn-primary">
                  Go to {storeProduct.title}
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
