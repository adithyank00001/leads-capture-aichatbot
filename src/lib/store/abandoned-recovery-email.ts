import "server-only";

import { sendResendEmail } from "@/lib/email/resend";
import { serverEnv } from "@/lib/env.server";

export type AbandonedRecoveryEmailInput = {
  toEmail: string;
  discountUrl?: string;
  subject?: string;
};

export type AbandonedRecoveryEmailResult = {
  email: string;
  ok: boolean;
  id?: string | null;
  error?: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildAbandonedRecoveryEmailHtml(params: {
  toEmail: string;
  targetUrl: string;
}) {
  const { targetUrl } = params;
  const safeTargetUrl = escapeHtml(targetUrl);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Special ₹100 Off on 110Cr+ PAN India Database</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f5f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #101828; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f3f5f8; padding: 32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e4e7ec; overflow: hidden; box-shadow: 0 12px 36px rgba(16, 24, 40, 0.08);">
          
          <!-- Top Accent Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #072654 0%, #1e3a8a 100%); padding: 24px 28px; text-align: left;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="display: inline-block; font-size: 19px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">
                      growscale<span style="color: #60a5fa;">X</span>
                    </span>
                    <span style="display: inline-block; margin-left: 10px; background-color: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.25); color: #ffffff; font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 999px;">
                      ✓ Verified Seller
                    </span>
                  </td>
                  <td align="right">
                    <span style="background-color: #059669; color: #ffffff; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.03em;">
                      ₹100 Extra Off
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px 28px 24px 28px;">
              <h1 style="margin: 0 0 14px 0; font-size: 24px; line-height: 1.3; font-weight: 800; color: #101828; letter-spacing: -0.02em;">
                Don&apos;t Miss Out on the 110Cr+ Verified Leads Database!
              </h1>
              
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #344054;">
                Get instant access to the entire leads database today with an exclusive <strong>extra offer of ₹100 OFF</strong> applied to your order.
              </p>

              <!-- Pricing Highlight Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border: 1px solid #a7f3d0; border-radius: 12px; margin-bottom: 24px; padding: 18px 20px;">
                <tr>
                  <td>
                    <div style="font-size: 12px; font-weight: 800; color: #047857; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 6px;">
                      🔥 100Rs Extra Off Applied
                    </div>
                    <div style="font-size: 30px; font-weight: 800; color: #065f46; line-height: 1.1;">
                      ₹297 <span style="font-size: 24px; font-weight: 700; color: #9ca3af; text-decoration: line-through; text-decoration-thickness: 2.5px; margin-left: 10px;">₹397</span>
                      <span style="font-size: 13px; font-weight: 700; color: #047857; background: #d1fae5; padding: 4px 9px; border-radius: 6px; margin-left: 8px; vertical-align: middle;">
                        SAVE ₹4,700
                      </span>
                    </div>
                    <div style="font-size: 12px; color: #b45309; font-weight: 600; margin-top: 8px;">
                      ⏰ Limited offer · Valid for next 24 hours only
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Big Primary CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 26px;">
                <tr>
                  <td align="center">
                    <a href="${safeTargetUrl}" target="_blank" style="display: block; width: 100%; box-sizing: border-box; text-align: center; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 700; padding: 16px 24px; border-radius: 10px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);">
                      Claim My Database at ₹297 Now →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- What You Get Section -->
              <div style="border-top: 1px solid #e4e7ec; padding-top: 22px; margin-bottom: 22px;">
                <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: #101828; text-transform: uppercase; letter-spacing: 0.03em;">
                  Here is everything included in your download:
                </p>
                
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding: 6px 0; font-size: 14px; color: #344054;">
                      ✅ <strong>110 Crore+ High Quality Verified Contacts</strong> across 200+ categories
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-size: 14px; color: #344054;">
                      ✅ <strong>Includes Name, Phone, WhatsApp, Email & Location details</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-size: 14px; color: #344054;">
                      🎁 <strong>BONUS 1:</strong> Google Business Leads Scraper Tool (Worth ₹5000+)
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-size: 14px; color: #344054;">
                      🎁 <strong>BONUS 2:</strong> USA Leads Database (10 Lakhs+ leads)
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-size: 14px; color: #344054;">
                      🎁 <strong>BONUS 3:</strong> CRM Tracking Blueprint System
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-size: 14px; color: #344054;">
                      ⚡ <strong>Instant Delivery:</strong> Google Drive access link sent right after payment
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-size: 14px; color: #344054;">
                      🔒 <strong>Lifetime Access:</strong> Download and keep files forever
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Secondary Link Fallback -->
              <p style="margin: 0; font-size: 12px; color: #667085; line-height: 1.5; word-break: break-all;">
                If the button above does not open, copy and paste this secret link into your browser:<br>
                <a href="${safeTargetUrl}" style="color: #2563eb; text-decoration: underline;">${safeTargetUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e4e7ec; padding: 20px 28px; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 600; color: #344054;">
                🔒 Secured by Razorpay · Instant Google Drive delivery
              </p>
              <p style="margin: 0; font-size: 12px; color: #667085;">
                Need help? Simply reply to this email or contact support@growscalex.com<br>
                © ${new Date().getFullYear()} growscaleX. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function buildAbandonedRecoveryEmailText(params: {
  toEmail: string;
  targetUrl: string;
}) {
  const { toEmail, targetUrl } = params;
  const username = toEmail.split("@")[0] || "there";

  return `
Hi ${username},

Don't miss out on the 110Cr+ verified leads database!

Get instant access to the entire leads database today with an exclusive extra offer of ₹100 OFF applied to your order.

Your Special Price: ₹297 ONLY (Regular: ₹397 | MRP: ₹4,997)
Discount: 100Rs Extra Off applied
Validity: Valid for next 24 hours only

Claim your ₹297 special price here:
${targetUrl}

What's included:
- 110 Crore+ High Quality Verified Contacts across 200+ categories
- Complete Name, Email, Phone, WhatsApp & Location details
- BONUS: Google Business Leads Scraper Tool (Worth ₹5,000+)
- BONUS: USA Leads Database (10 Lakhs+ leads)
- BONUS: CRM Tracking Blueprint System
- Instant delivery to your email right after payment
- Lifetime access & Excel/CSV compatibility

Pay securely via Razorpay on the link above:
${targetUrl}

Questions? Reply directly to this email.

Best regards,
growscaleX Team
support@growscalex.com
  `.trim();
}

/**
 * Send an abandoned checkout recovery email to a single recipient.
 */
export async function sendAbandonedRecoveryEmail(
  input: AbandonedRecoveryEmailInput,
): Promise<AbandonedRecoveryEmailResult> {
  const email = input.toEmail.trim().toLowerCase();
  if (!email.includes("@")) {
    return { email, ok: false, error: "Invalid email address format." };
  }

  const appBase =
    process.env.NEXT_PUBLIC_APP_URL?.trim() || serverEnv.appUrl || "https://www.growscalex.com";
  const baseUrl = appBase.replace(/\/+$/, "");
  const targetUrl = input.discountUrl?.trim() || `${baseUrl}/store/product/x9k2p7m4q8`;
  const subject =
    input.subject?.trim() ||
    "🔥 Don't miss out: 110Cr+ Verified Leads Database + Extra ₹100 OFF applied!";

  const html = buildAbandonedRecoveryEmailHtml({ toEmail: email, targetUrl });
  const text = buildAbandonedRecoveryEmailText({ toEmail: email, targetUrl });

  try {
    const result = await sendResendEmail({
      to: email,
      subject,
      text,
      html,
    });

    if (!result.ok) {
      return {
        email,
        ok: false,
        error: result.error || "Failed to send email.",
      };
    }

    if (result.skipped) {
      return {
        email,
        ok: false,
        error:
          result.reason === "not_configured"
            ? "Resend API key is not configured in environment."
            : "Recipient email rejected.",
      };
    }

    return { email, ok: true, id: result.id };
  } catch (error) {
    return {
      email,
      ok: false,
      error: error instanceof Error ? error.message : "Unexpected email error.",
    };
  }
}
