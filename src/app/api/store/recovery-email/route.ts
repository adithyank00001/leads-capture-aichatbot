import { NextResponse } from "next/server";

import {
  sendAbandonedRecoveryEmail,
  type AbandonedRecoveryEmailResult,
} from "@/lib/store/abandoned-recovery-email";

export const maxDuration = 60; // Allow sufficient time for batch sends on Vercel/Node

type RecoveryRequestBody = {
  emails?: unknown;
  customDiscountUrl?: string;
  customSubject?: string;
};

function parseEmailList(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .map((item) => String(item).trim().toLowerCase())
      .filter((item) => item.includes("@") && item.length <= 150);
  }
  if (typeof raw === "string") {
    // Match any email pattern in the raw text
    const matches = raw.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
    if (!matches) return [];
    return matches.map((m) => m.trim().toLowerCase());
  }
  return [];
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as RecoveryRequestBody;
    const rawEmails = body.emails;
    const uniqueEmails = Array.from(new Set(parseEmailList(rawEmails)));

    if (uniqueEmails.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No valid email addresses provided." },
        { status: 400 },
      );
    }

    if (uniqueEmails.length > 200) {
      return NextResponse.json(
        {
          ok: false,
          error: "Batch limit is 200 emails per request to prevent timeouts.",
        },
        { status: 400 },
      );
    }

    const results: AbandonedRecoveryEmailResult[] = [];
    let sentCount = 0;
    let failedCount = 0;

    for (let i = 0; i < uniqueEmails.length; i++) {
      const email = uniqueEmails[i];
      const sendRes = await sendAbandonedRecoveryEmail({
        toEmail: email,
        discountUrl: body.customDiscountUrl,
        subject: body.customSubject,
      });

      results.push(sendRes);
      if (sendRes.ok) {
        sentCount++;
      } else {
        failedCount++;
      }

      // Small 120ms pause between sends to be gentle on Resend rate limits
      if (i < uniqueEmails.length - 1) {
        await sleep(120);
      }
    }

    return NextResponse.json({
      ok: true,
      total: uniqueEmails.length,
      sent: sentCount,
      failed: failedCount,
      results,
    });
  } catch (error) {
    console.error("[api/store/recovery-email]", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to process recovery emails.",
      },
      { status: 500 },
    );
  }
}

