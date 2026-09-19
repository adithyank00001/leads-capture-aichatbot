import "server-only";

import { readFile } from "fs/promises";

import { sendResendEmail } from "@/lib/email/resend";
import { serverEnv } from "@/lib/env.server";
import {
  getStoreDownloadAbsolutePath,
  STORE_DOWNLOAD_FILE,
} from "@/lib/store/download";
import { storeProduct } from "@/lib/store/product-content";

export type SendStorePurchaseEmailInput = {
  toEmail: string | null | undefined;
  paymentId: string;
  customerName?: string | null;
  productTitle?: string;
  value?: number;
  currency?: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatMoney(value: number | undefined, currency: string | undefined) {
  const amount = Number.isFinite(value) ? Number(value) : storeProduct.price;
  const code = (currency || "INR").toUpperCase();
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: code,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${code} ${amount}`;
  }
}

async function loadPdfAttachment(): Promise<{
  filename: string;
  content: string;
  content_type: string;
} | null> {
  try {
    const bytes = await readFile(getStoreDownloadAbsolutePath());
    return {
      filename: STORE_DOWNLOAD_FILE.fileName,
      content: bytes.toString("base64"),
      content_type: STORE_DOWNLOAD_FILE.contentType,
    };
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        route: "store/purchase-email",
        message:
          error instanceof Error
            ? `PDF attach failed: ${error.message}`
            : "PDF attach failed",
        timestamp: new Date().toISOString(),
      }),
    );
    return null;
  }
}

/**
 * Email the buyer their leads PDF + download link after a paid store order.
 * Safe to call twice (webhook + success page) — Resend Idempotency-Key dedupes.
 * Never throws.
 */
export async function sendStorePurchaseEmail(
  input: SendStorePurchaseEmailInput,
): Promise<void> {
  const paymentId = input.paymentId.trim();
  const toEmail = input.toEmail?.trim() ?? "";
  if (!paymentId || !toEmail.includes("@")) {
    return;
  }

  const origin = serverEnv.appUrl.replace(/\/+$/, "") || "http://localhost:3000";
  const downloadUrl = `${origin}/api/store/download?payment_id=${encodeURIComponent(paymentId)}`;
  const productTitle = input.productTitle?.trim() || storeProduct.title;
  const priceLabel = formatMoney(input.value, input.currency);
  const firstName =
    input.customerName?.trim().split(/\s+/)[0] ||
    toEmail.split("@")[0] ||
    "there";

  const text = [
    `Hi ${firstName},`,
    "",
    `Thanks for your purchase of ${productTitle}.`,
    "",
    `Amount: ${priceLabel}`,
    `Payment ID: ${paymentId}`,
    "",
    "Your PDF package is attached to this email.",
    "You can also download it any time from this link:",
    downloadUrl,
    "",
    "If the attachment is missing, use the link above (it only works after a successful payment).",
    "",
    "Questions? Reply to this email or contact support@growscalex.com",
    "",
    "— growscaleX",
  ].join("\n");

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#1a1a1a;max-width:560px;margin:0 auto;padding:24px;">
  <p>Hi ${escapeHtml(firstName)},</p>
  <p>Thanks for your purchase of <strong>${escapeHtml(productTitle)}</strong>.</p>
  <p style="margin:16px 0;padding:12px 16px;background:#f6f6f4;border-radius:8px;">
    <strong>Amount:</strong> ${escapeHtml(priceLabel)}<br/>
    <strong>Payment ID:</strong> ${escapeHtml(paymentId)}
  </p>
  <p>Your PDF package is <strong>attached</strong> to this email.</p>
  <p>
    <a href="${escapeHtml(downloadUrl)}" style="display:inline-block;padding:12px 20px;background:#e85d04;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">
      Download PDF package
    </a>
  </p>
  <p style="font-size:13px;color:#666;">If the button does not work, copy this link:<br/>${escapeHtml(downloadUrl)}</p>
  <p style="font-size:13px;color:#666;">Questions? Reply to this email or write to support@growscalex.com</p>
  <p>— growscaleX</p>
</body>
</html>`.trim();

  const attachment = await loadPdfAttachment();

  const result = await sendResendEmail({
    to: toEmail,
    subject: `Your leads package is ready — ${productTitle}`,
    text,
    html,
    replyTo: serverEnv.contactInboxEmail,
    idempotencyKey: `store-purchase-email-${paymentId}`,
    attachments: attachment ? [attachment] : undefined,
  });

  if (result.ok && result.skipped) {
    if (result.reason === "not_configured") {
      console.error(
        JSON.stringify({
          level: "warn",
          route: "store/purchase-email",
          message: "RESEND_API_KEY missing — purchase email skipped",
          paymentId,
          timestamp: new Date().toISOString(),
        }),
      );
    }
    return;
  }

  if (!result.ok) {
    console.error(
      JSON.stringify({
        level: "error",
        route: "store/purchase-email",
        message: `Purchase email failed: ${result.error}`,
        status: result.status ?? null,
        paymentId,
        timestamp: new Date().toISOString(),
      }),
    );
  }
}
