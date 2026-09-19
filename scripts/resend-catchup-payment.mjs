import { readFileSync } from "node:fs";

const key = process.env.RESEND_API_KEY;
const from = process.env.RESEND_FROM_EMAIL;
const paymentId = process.argv[2] || "pay_0NnwhB1zQTans0zeqL6d9";
const to = process.argv[3] || "adithyank0001@gmail.com";
const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://www.growscalex.com").replace(
  /\/+$/,
  "",
);
const downloadUrl = `${appUrl}/api/store/download?payment_id=${encodeURIComponent(paymentId)}`;
const pdf = readFileSync(
  "private/store/downloads/ALL-INDIA-COMPLETE-DATABASE-PACKAGE-BUNDLE-2026.pdf",
);

const response = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    "Idempotency-Key": `store-purchase-email-${paymentId}`,
  },
  body: JSON.stringify({
    from,
    to: [to],
    reply_to: process.env.CONTACT_INBOX_EMAIL || "support@growscalex.com",
    subject:
      "Your leads package is ready — 110Cr+ All India Latest Leads (PAN INDIA DATABASE) 2026",
    text: [
      "Hi there,",
      "",
      "Thanks for your purchase.",
      `Payment ID: ${paymentId}`,
      `Download: ${downloadUrl}`,
      "",
      "PDF attached.",
      "— growscaleX",
    ].join("\n"),
    html: `<p>Thanks for your purchase.</p><p><a href="${downloadUrl}">Download PDF package</a></p><p>Payment ID: ${paymentId}</p>`,
    attachments: [
      {
        filename: "ALL-INDIA-COMPLETE-DATABASE-PACKAGE-BUNDLE-2026.pdf",
        content: pdf.toString("base64"),
        content_type: "application/pdf",
      },
    ],
  }),
});

const body = await response.text();
console.log(
  JSON.stringify({
    ok: response.ok,
    status: response.status,
    to,
    paymentId,
    body: body.slice(0, 400),
  }),
);
process.exit(response.ok ? 0 : 1);
