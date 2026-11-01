"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Mail,
  RefreshCw,
  Send,
  Sparkles,
  Tag,
  Trash2,
} from "lucide-react";

type SendResultItem = {
  email: string;
  ok: boolean;
  id?: string | null;
  error?: string;
};

type SendResponse = {
  ok: boolean;
  total?: number;
  sent?: number;
  failed?: number;
  results?: SendResultItem[];
  error?: string;
};

export default function RecoverAbandonedCheckoutsPage() {
  const [rawText, setRawText] = useState("");
  const [customDiscountUrl, setCustomDiscountUrl] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [response, setResponse] = useState<SendResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const textareaId = useId();
  const testInputId = useId();

  // Smart regex extraction of all unique emails from whatever text is pasted
  const parsedEmails = useMemo(() => {
    if (!rawText.trim()) return [];
    const matches = rawText.match(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    );
    if (!matches) return [];
    const lower = matches.map((e) => e.trim().toLowerCase());
    return Array.from(new Set(lower));
  }, [rawText]);

  const defaultUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/store/product/x9k2p7m4q8`
      : "https://www.growscalex.com/store/product/x9k2p7m4q8";

  const targetDiscountUrl = customDiscountUrl.trim() || defaultUrl;

  async function handleSendBulk() {
    if (parsedEmails.length === 0) {
      setErrorMsg("Please paste at least one valid email address.");
      return;
    }

    const confirmSend = window.confirm(
      `Are you sure you want to send the ₹100 discount recovery email to ${parsedEmails.length} customer(s)?`,
    );
    if (!confirmSend) return;

    setIsSending(true);
    setErrorMsg(null);
    setResponse(null);

    try {
      const res = await fetch("/api/store/recovery-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emails: parsedEmails,
          customDiscountUrl: targetDiscountUrl,
          customSubject: customSubject.trim() || undefined,
        }),
      });

      const data = (await res.json()) as SendResponse;
      if (!res.ok || !data.ok) {
        setErrorMsg(data.error || "Failed to send emails. Check your Resend setup.");
      } else {
        setResponse(data);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Network error.");
    } finally {
      setIsSending(false);
    }
  }

  async function handleSendTest() {
    const trimmed = testEmail.trim().toLowerCase();
    if (!trimmed.includes("@")) {
      setTestStatus("Enter a valid test email address.");
      return;
    }

    setIsSendingTest(true);
    setTestStatus("Sending test email...");

    try {
      const res = await fetch("/api/store/recovery-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emails: [trimmed],
          customDiscountUrl: targetDiscountUrl,
          customSubject: customSubject.trim() || undefined,
        }),
      });

      const data = (await res.json()) as SendResponse;
      if (res.ok && data.ok && data.sent && data.sent > 0) {
        setTestStatus(`✓ Test email delivered to ${trimmed}! Check your inbox.`);
      } else {
        const detail = data.results?.[0]?.error || data.error || "Failed";
        setTestStatus(`✕ Error sending test: ${detail}`);
      }
    } catch (err) {
      setTestStatus(
        `✕ Network error: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setIsSendingTest(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <header className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-300 mb-2">
                <Tag className="size-3 text-emerald-600" />
                Special Discount Recovery Tool
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Abandoned Checkout Email Sender
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Send persuasive recovery emails offering ₹100 additional off (₹297) for the 110Cr+ Indian Database.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2 text-slate-700">
              <span className="font-semibold text-slate-900">Target Page:</span>
              <code className="bg-slate-100 px-2 py-0.5 rounded text-xs text-blue-700 font-mono">
                /store/product/x9k2p7m4q8 (₹297)
              </code>
            </div>
            <Link
              href="/store/product/x9k2p7m4q8"
              target="_blank"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 underline"
            >
              Preview Secret Product Page <ExternalLink className="size-3" />
            </Link>
          </div>
        </header>

        {/* Input Card */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor={textareaId}
                className="text-sm font-bold text-slate-900"
              >
                Paste Customer Email IDs
              </label>
              {parsedEmails.length > 0 && (
                <button
                  type="button"
                  onClick={() => setRawText("")}
                  className="text-xs text-slate-400 hover:text-red-600 inline-flex items-center gap-1"
                >
                  <Trash2 className="size-3" /> Clear list
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 mb-2">
              You can paste emails separated by commas, newlines, or copy-paste directly from Razorpay / Sheets:
            </p>
            <textarea
              id={textareaId}
              rows={6}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="rahul.sharma@gmail.com&#10;amit99@yahoo.com&#10;priya.business@gmail.com, vikram@techcorp.in"
              className="w-full rounded-xl border border-slate-300 p-3.5 text-sm font-mono focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
            />
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">
                {parsedEmails.length > 0 ? (
                  <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                    <CheckCircle2 className="size-3 text-emerald-600" />
                    {parsedEmails.length} valid unique email{parsedEmails.length === 1 ? "" : "s"} detected
                  </span>
                ) : (
                  <span className="text-slate-400">0 emails detected</span>
                )}
              </span>
              <span className="text-slate-400">Duplicates are auto-filtered</span>
            </div>
          </div>

          {/* Quick Test Email Section */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Mail className="size-4 text-blue-600" />
              <span>Send a Test Email to Yourself First</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <label htmlFor={testInputId} className="sr-only">
                Test email address
              </label>
              <input
                id={testInputId}
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="your-email@gmail.com"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => void handleSendTest()}
                disabled={isSendingTest || !testEmail.trim()}
                className="rounded-lg bg-slate-900 text-white px-4 py-2 text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-1.5"
              >
                {isSendingTest ? (
                  <>
                    <RefreshCw className="size-3.5 animate-spin" /> Sending...
                  </>
                ) : (
                  "Send Test"
                )}
              </button>
            </div>
            {testStatus && (
              <p
                className={`text-xs ${
                  testStatus.startsWith("✓")
                    ? "text-emerald-700 font-semibold"
                    : "text-amber-700"
                }`}
              >
                {testStatus}
              </p>
            )}
          </div>

          {/* Optional Custom Settings */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => setPreviewOpen(!previewOpen)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              {previewOpen ? "▼ Hide Email Preview & Advanced Settings" : "▶ Show Email Preview & Advanced Settings"}
            </button>

            {previewOpen && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Custom Subject Line (Optional)
                  </label>
                  <input
                    type="text"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    placeholder="🔥 Don't miss out: 110Cr+ Verified Leads Database + Extra ₹100 OFF applied!"
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Custom Checkout Link (Optional)
                  </label>
                  <input
                    type="text"
                    value={customDiscountUrl}
                    onChange={(e) => setCustomDiscountUrl(e.target.value)}
                    placeholder={defaultUrl}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white font-mono"
                  />
                </div>

                <div className="border-t border-slate-200 pt-3">
                  <p className="font-bold text-slate-900 mb-1">Email Content Summary:</p>
                  <ul className="list-disc list-inside space-y-1 text-slate-600">
                    <li>Heading: <span className="text-slate-900 font-semibold">Don&apos;t Miss Out on the 110Cr+ Verified Leads Database!</span></li>
                    <li>Subheading: <span className="text-slate-900 font-medium">Get the entire leads database with an extra offer of ₹100 OFF</span></li>
                    <li>Discount Offer: <span className="text-emerald-700 font-bold">₹297 only (Save ₹4,700)</span></li>
                    <li>Urgency: <span className="text-amber-700 font-medium">Valid for 24 hours only</span></li>
                    <li>Highlights: 110Cr+ contacts, B2B/B2C, phone, WhatsApp, email, city/state</li>
                    <li>Bonuses included: Google Business Scraper Tool + USA Leads Database + CRM Blueprint</li>
                    <li>CTA Button: <span className="text-blue-700 font-semibold">[ Claim My Database at ₹297 Now → ]</span></li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Main Action Button */}
          <div>
            <button
              type="button"
              onClick={() => void handleSendBulk()}
              disabled={isSending || parsedEmails.length === 0}
              className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white py-3.5 px-6 font-bold text-base shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSending ? (
                <>
                  <RefreshCw className="size-5 animate-spin" />
                  Sending Recovery Emails to {parsedEmails.length} Customers...
                </>
              ) : (
                <>
                  <Send className="size-5" />
                  Send Recovery Email to {parsedEmails.length} Customer{parsedEmails.length === 1 ? "" : "s"}
                </>
              )}
            </button>
            <p className="text-center text-xs text-slate-500 mt-2">
              Emails are sent with automatic throttling via Resend so delivery is reliable.
            </p>
          </div>

          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
              <AlertCircle className="size-4 shrink-0 mt-0.5 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}
        </section>

        {/* Results Report Card */}
        {response && (
          <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="size-5 text-emerald-600" />
                Delivery Report
              </h2>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
                  Total: {response.total}
                </span>
                <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
                  Sent: {response.sent}
                </span>
                {response.failed && response.failed > 0 ? (
                  <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full">
                    Failed: {response.failed}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
              {response.results?.map((item) => (
                <div
                  key={item.email}
                  className="p-3 flex items-center justify-between gap-2"
                >
                  <span className="font-mono text-slate-800 truncate">
                    {item.email}
                  </span>
                  <div>
                    {item.ok ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                        <CheckCircle2 className="size-3 text-emerald-600" /> Delivered
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-700 font-semibold bg-red-50 px-2 py-0.5 rounded">
                        <AlertCircle className="size-3 text-red-600" />
                        {item.error || "Failed"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

