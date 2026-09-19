import "server-only";

import { serverEnv } from "@/lib/env.server";

export type ResendAttachment = {
  filename: string;
  /** Base64-encoded file contents (Resend API format). */
  content: string;
  content_type?: string;
};

export type SendResendEmailInput = {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
  attachments?: ResendAttachment[];
  /** Same key within ~24h → Resend returns the first send (no duplicate). */
  idempotencyKey?: string;
};

export type SendResendEmailResult =
  | { ok: true; id: string | null; skipped?: false }
  | { ok: true; id: null; skipped: true; reason: "not_configured" | "invalid_to" }
  | { ok: false; status?: number; error: string };

function normalizeRecipients(to: string | string[]): string[] {
  const list = Array.isArray(to) ? to : [to];
  return list
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.includes("@") && value.length <= 200);
}

/**
 * Send one email via Resend. Never throws.
 * Reads API key at call time so new .env values work without stale module cache.
 */
export async function sendResendEmail(
  input: SendResendEmailInput,
): Promise<SendResendEmailResult> {
  const apiKey =
    process.env.RESEND_API_KEY?.trim() || serverEnv.resendApiKey;
  if (!apiKey) {
    return { ok: true, id: null, skipped: true, reason: "not_configured" };
  }

  const from =
    process.env.RESEND_FROM_EMAIL?.trim() || serverEnv.resendFromEmail;

  const recipients = normalizeRecipients(input.to);
  if (recipients.length === 0) {
    return { ok: true, id: null, skipped: true, reason: "invalid_to" };
  }

  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };
    const idempotencyKey = input.idempotencyKey?.trim();
    if (idempotencyKey) {
      headers["Idempotency-Key"] = idempotencyKey.slice(0, 256);
    }

    const body: Record<string, unknown> = {
      from,
      to: recipients,
      subject: input.subject,
      text: input.text,
    };

    if (input.html) {
      body.html = input.html;
    }
    if (input.replyTo?.trim()) {
      body.reply_to = input.replyTo.trim();
    }
    if (input.attachments?.length) {
      body.attachments = input.attachments;
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      return {
        ok: false,
        status: response.status,
        error: errText.slice(0, 400) || `Resend HTTP ${response.status}`,
      };
    }

    const json = (await response.json().catch(() => null)) as {
      id?: string;
    } | null;

    return { ok: true, id: typeof json?.id === "string" ? json.id : null };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Resend request failed.",
    };
  }
}
