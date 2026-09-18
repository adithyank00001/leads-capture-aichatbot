"use client";

import { useState, type FormEvent } from "react";

type DeliveryResult = {
  ok: boolean;
  delivery?: "email" | "mailto" | "accepted";
  mailto?: string;
  notice?: string;
  error?: string;
};

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusText, setStatusText] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setStatus("idle");
    setStatusText(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message, website }),
      });

      const data = (await response.json()) as DeliveryResult;

      if (!response.ok || data.error) {
        setStatus("error");
        setStatusText(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      if (data.delivery === "mailto" && data.mailto) {
        window.location.href = data.mailto;
        setStatus("success");
        setStatusText(
          data.notice ??
            "Your email app should open with the message ready. Send it to reach support.",
        );
        return;
      }

      setStatus("success");
      setStatusText("Message sent. We will reply to your email soon.");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch {
      setStatus("error");
      setStatusText("Network error. Please email support@growscalex.com directly.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Honeypot — hidden from real users */}
      <input
        type="text"
        name="website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-[var(--landing-navy)]">Name</span>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-[#D8E2EC] px-3 py-2.5 text-[15px] outline-none ring-[var(--landing-orange)] focus:ring-2"
          placeholder="Your name"
          maxLength={120}
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-[var(--landing-navy)]">Email</span>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-[#D8E2EC] px-3 py-2.5 text-[15px] outline-none ring-[var(--landing-orange)] focus:ring-2"
          placeholder="you@example.com"
          maxLength={200}
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-[var(--landing-navy)]">Subject</span>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full rounded-md border border-[#D8E2EC] px-3 py-2.5 text-[15px] outline-none ring-[var(--landing-orange)] focus:ring-2"
          placeholder="Order help, product question, etc."
          maxLength={200}
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-[var(--landing-navy)]">Message</span>
        <textarea
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          className="w-full resize-y rounded-md border border-[#D8E2EC] px-3 py-2.5 text-[15px] outline-none ring-[var(--landing-orange)] focus:ring-2"
          placeholder="Write your message..."
          maxLength={5000}
        />
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex w-full items-center justify-center rounded-md bg-[var(--landing-navy)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[160px]"
      >
        {submitting ? "Sending..." : "Send message"}
      </button>

      {statusText ? (
        <p
          role="status"
          className={
            status === "error"
              ? "text-sm text-red-600"
              : "text-sm text-[#3D4F63]"
          }
        >
          {statusText}
        </p>
      ) : null}
    </form>
  );
}
