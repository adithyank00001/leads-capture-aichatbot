import Link from "next/link";
import { headers } from "next/headers";

import { MetaPixelPurchase } from "@/components/meta-pixel-purchase";
import { serverEnv } from "@/lib/env.server";
import { sendPurchaseEventFromPageRequest } from "@/lib/meta/capi";
import {
  buildStorePurchaseCustomData,
  buildStorePurchaseCustomer,
} from "@/lib/meta/store-purchase-meta";
import { getStoreDownloadForSlug } from "@/lib/store/download";
import { storeProduct } from "@/lib/store/product-content";
import {
  getPaidPurchaseByDownloadToken,
  getPaidPurchaseByPaymentId,
} from "@/lib/store/purchases";
import { sendStorePurchaseEmail } from "@/lib/store/send-purchase-email";
import { verifyStoreDodoPayment } from "@/lib/store/verify-dodo-payment";

/** Success-page email is only a short backup; late revisits must not re-send (Resend idempotency ~24h). */
const SUCCESS_EMAIL_BACKUP_MAX_AGE_MS = 6 * 60 * 60 * 1000;

type Props = {
  searchParams: Promise<{
    payment_id?: string;
    status?: string;
    token?: string;
  }>;
};

type StoreSuccessView = {
  ok: true;
  paymentId: string;
  orderId: string | null;
  email: string | null;
  phone: string | null;
  customerName: string | null;
  productTitle: string;
  productSlug: string;
  value: number;
  currency: string;
  quantity: number;
  downloadHref: string;
  /** From store_purchases.paid_at. Null for legacy Dodo success (keep backup send). */
  paidAt: string | null;
};

function isPaidRecently(paidAt: string | null): boolean {
  if (!paidAt) return true;
  const paidAtMs = Date.parse(paidAt);
  if (!Number.isFinite(paidAtMs)) return true;
  return Date.now() - paidAtMs <= SUCCESS_EMAIL_BACKUP_MAX_AGE_MS;
}

export default async function StoreSuccessPage({ searchParams }: Props) {
  const params = await searchParams;
  const paymentIdParam = params.payment_id?.trim() ?? "";
  const token = params.token?.trim() ?? "";
  const status = params.status?.trim() ?? "";

  let verification: StoreSuccessView | { ok: false } = { ok: false };

  if (token) {
    const purchase = await getPaidPurchaseByDownloadToken(token);
    if (purchase) {
      const paymentId = purchase.razorpay_payment_id ?? paymentIdParam;
      verification = {
        ok: true,
        paymentId,
        orderId: purchase.razorpay_order_id,
        email: purchase.customer_email,
        phone: purchase.customer_phone,
        customerName: purchase.customer_name,
        productTitle: purchase.product_title,
        productSlug: purchase.product_slug,
        value: purchase.amount_paise / 100,
        currency: (purchase.currency || "INR").toUpperCase(),
        quantity: purchase.quantity,
        downloadHref: `/api/store/download?token=${encodeURIComponent(token)}`,
        paidAt: purchase.paid_at ?? null,
      };
    }
  }

  if (!verification.ok && paymentIdParam) {
    const purchase = await getPaidPurchaseByPaymentId(paymentIdParam);
    if (purchase?.download_token) {
      verification = {
        ok: true,
        paymentId: purchase.razorpay_payment_id ?? paymentIdParam,
        orderId: purchase.razorpay_order_id,
        email: purchase.customer_email,
        phone: purchase.customer_phone,
        customerName: purchase.customer_name,
        productTitle: purchase.product_title,
        productSlug: purchase.product_slug,
        value: purchase.amount_paise / 100,
        currency: (purchase.currency || "INR").toUpperCase(),
        quantity: purchase.quantity,
        downloadHref: `/api/store/download?token=${encodeURIComponent(purchase.download_token)}`,
        paidAt: purchase.paid_at ?? null,
      };
    } else {
      // Legacy Dodo success links still work.
      const dodo = await verifyStoreDodoPayment({
        paymentId: paymentIdParam,
        status: status || "succeeded",
      });
      if (dodo.ok) {
        verification = {
          ok: true,
          paymentId: dodo.paymentId,
          orderId: null,
          email: dodo.email,
          phone: null,
          customerName: dodo.customer?.fullName ?? null,
          productTitle: dodo.productTitle,
          productSlug: dodo.productSlug,
          value: dodo.value,
          currency: dodo.currency,
          quantity: dodo.quantity,
          downloadHref: `/api/store/download?payment_id=${encodeURIComponent(dodo.paymentId)}`,
          paidAt: null,
        };
      }
    }
  }

  const requestHeaders = await headers();
  const origin = serverEnv.appUrl.replace(/\/+$/, "") || "http://localhost:3000";
  const paidRecently = verification.ok
    ? isPaidRecently(verification.paidAt)
    : false;

  if (verification.ok) {
    await Promise.all([
      sendPurchaseEventFromPageRequest({
        paymentId: verification.paymentId,
        email: verification.email,
        customer: buildStorePurchaseCustomer({
          paymentId: verification.paymentId,
          orderId: verification.orderId,
          email: verification.email,
          phone: verification.phone,
          fullName: verification.customerName,
          productSlug: verification.productSlug,
          productTitle: verification.productTitle,
          value: verification.value,
          currency: verification.currency,
          quantity: verification.quantity,
        }),
        eventSourceUrl: `${origin}/store/success`,
        requestHeaders,
        customData: buildStorePurchaseCustomData({
          paymentId: verification.paymentId,
          orderId: verification.orderId,
          email: verification.email,
          phone: verification.phone,
          fullName: verification.customerName,
          productSlug: verification.productSlug,
          productTitle: verification.productTitle,
          value: verification.value,
          currency: verification.currency,
          quantity: verification.quantity,
        }),
      }),
      // Backup only while purchase is fresh. Late revisits skip email
      // (Resend idempotency expires ~24h and was causing duplicate sends).
      paidRecently
        ? sendStorePurchaseEmail({
            toEmail: verification.email,
            paymentId: verification.paymentId,
            productSlug: verification.productSlug,
            productTitle: verification.productTitle,
            value: verification.value,
            currency: verification.currency,
          })
        : Promise.resolve(),
    ]);
  }

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
          orderId={verification.orderId}
          email={verification.email}
          phone={verification.phone}
          fullName={verification.customerName}
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

              {verification.email && paidRecently ? (
                <p className="mt-3 text-sm text-[var(--store-muted)]">
                  We also emailed the PDF to{" "}
                  <strong>{verification.email}</strong>. Check inbox (and
                  spam).
                </p>
              ) : null}

              <div className="mt-8 space-y-3">
                <a
                  className="store-btn-primary"
                  href={verification.downloadHref}
                  download
                >
                  Download PDF package
                </a>
              </div>

              <p className="mt-6 text-xs text-[var(--store-muted)]">
                File: {getStoreDownloadForSlug(verification.productSlug)?.fileName}
                <br />
                Payment ID: {verification.paymentId}
              </p>
            </>
          ) : (
            <>
              <p className="store-eyebrow">Download locked</p>
              <h1 className="store-title text-[2rem]">Payment not found</h1>
              <p className="mt-3 text-[var(--store-muted)]">
                We could not confirm a paid order for this link. Complete
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
