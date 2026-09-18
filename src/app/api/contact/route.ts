import { NextResponse } from "next/server";

import { serverEnv } from "@/lib/env.server";

export const runtime = "nodejs";

type ContactBody = {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  website?: string; // honeypot
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  let body: ContactBody;

  try {
    body = (await request.json()) as ContactBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Silent success for bots filling honeypot
  if (body.website?.trim()) {
    return NextResponse.json({ ok: true, delivery: "accepted" });
  }

  const name = body.name?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  const subject = body.subject?.trim() || "Storefront contact inquiry";
  const message = body.message?.trim() ?? "";

  if (name.length < 2 || name.length > 120) {
    return NextResponse.json({ error: "Please enter a valid name." }, { status: 400 });
  }
  if (!isValidEmail(email) || email.length > 200) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }
  if (message.length < 10 || message.length > 5000) {
    return NextResponse.json(
      { error: "Message must be between 10 and 5000 characters." },
      { status: 400 },
    );
  }
  if (subject.length > 200) {
    return NextResponse.json({ error: "Subject is too long." }, { status: 400 });
  }

  const inbox = serverEnv.contactInboxEmail;
  const textBody = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Subject: ${subject}`,
    "",
    message,
  ].join("\n");

  if (!serverEnv.resendApiKey) {
    const mailto = `mailto:${encodeURIComponent(inbox)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(textBody)}`;
    return NextResponse.json({
      ok: true,
      delivery: "mailto",
      mailto,
      notice:
        "Email service is not configured yet. Your mail app will open so you can send the message.",
    });
  }

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serverEnv.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: serverEnv.resendFromEmail,
      to: [inbox],
      reply_to: email,
      subject: `[Contact] ${subject}`,
      text: textBody,
    }),
  });

  if (!resendResponse.ok) {
    const errText = await resendResponse.text().catch(() => "");
    console.error("[contact] Resend failed", resendResponse.status, errText);
    const mailto = `mailto:${encodeURIComponent(inbox)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(textBody)}`;
    return NextResponse.json({
      ok: true,
      delivery: "mailto",
      mailto,
      notice: "We could not send automatically. Your mail app will open as a backup.",
    });
  }

  return NextResponse.json({ ok: true, delivery: "email" });
}
