import Link from "next/link";
import { headers } from "next/headers";

import { MetaPixelPurchase } from "@/components/meta-pixel-purchase";
import { serverEnv } from "@/lib/env.server";
import { sendPurchaseEventFromPageRequest } from "@/lib/meta/capi";
import { STORE_DOWNLOAD_FILE } from "@/lib/store/download";
import { storeProduct } from "@/lib/store/product-content";
import { sendStorePurchaseEmail } from "@/lib/store/send-purchase-email";
import { verifyStoreDodoPayment } from "@/lib/store/verify-dodo-payment";

type Props = {
  searchParams: Promise<{
    payment_id?: string;
    status?: string;
    token?: string;
  }>;
};

export default async function StoreSuccessPage({ searchParams }: Props) {
  const params = await searchParams;
  const paymentId = params.payment_id?.trim() ?? "";
  const status = params.status?.trim() ?? "";

  const verification = paymentId
    ? await verifyStoreDodoPayment({ paymentId, status: status || "succeeded" })
    : { ok: false as const };

  const requestHeaders = await headers();
  const origin = serverEnv.appUrl.replace(/\/+$/, "") || "http://localhost:3000";

  if (verification.ok) {
    await Promise.all([
      sendPurchaseEventFromPageRequest({
        paymentId: verification.paymentId,
        email: verification.email,
        customer: verification.customer,
        eventSourceUrl: `${origin}/store/success`,
        requestHeaders,
        customData: {
          value: verification.value,
          currency: verification.currency,
          order_id: verification.paymentId,
          content_ids: [verification.productSlug],
          content_name: verification.productTitle,
          content_type: "product",
          num_items: verification.quantity,
        },
      }),
      // Backup if webhook is slow/missed. Same Idempotency-Key → no double email.
      sendStorePurchaseEmail({
        toEmail: verification.email,
        paymentId: verification.paymentId,
        customerName: verification.customer?.fullName,
        productTitle: verification.productTitle,
        value: verification.value,
        currency: verification.currency,
      }),
    ]);
  }

  const downloadHref = paymentId
    ? `/api/store/download?payment_id=${encodeURIComponent(paymentId)}`
    : null;

  return (
    <div className="store-root min-h-full">
      {verification.ok ? (
        <MetaPixelPurchase
          eventId={verification.paymentId}
          value={verification.value}
          currency={verification.currency}
          contentName={verification.productTitle}
          contentIds={[verification.productSlug]}
          numItems={verification.quantity}
        />
      ) : null}

      <main className="store-shell flex min-h-[70vh] items-center py-16">
        <div className="mx-auto w-full max-w-xl rounded-[1.5rem] border border-[var(--store-line)] bg-white p-8 shadow-[var(--store-shadow)] sm:p-10">
          {verification.ok ? (
            <>
              <p className="store-eyebrow">Payment successful</p>
              <h1 className="store-title text-[2rem]">You can download now</h1>
              <p className="mt-3 text-[var(--store-muted)]">
                Thanks for buying <strong>{verification.productTitle}</strong>.
                Your payment is confirmed. Download the PDF package below.
              </p>

              {verification.email ? (
                <p className="mt-3 text-sm text-[var(--store-muted)]">
                  We also emailed the PDF to{" "}
                  <strong>{verification.email}</strong>. Check inbox (and
                  spam).
                </p>
              ) : null}

              <div className="mt-8 space-y-3">
                {downloadHref ? (
                  <a className="store-btn-primary" href={downloadHref} download>
                    Download PDF package
                  </a>
                ) : null}
              </div>

              <p className="mt-6 text-xs text-[var(--store-muted)]">
                File: {STORE_DOWNLOAD_FILE.fileName}
                <br />
                Payment ID: {verification.paymentId}
              </p>
            </>
          ) : (
            <>
              <p className="store-eyebrow">Download locked</p>
              <h1 className="store-title text-[2rem]">Payment not found</h1>
              <p className="mt-3 text-[var(--store-muted)]">
                We could not confirm a paid Dodo order for this link. Complete
                checkout on the product page, or open the success link from your
                payment email.
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
