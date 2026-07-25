"use client";

import { useEffect, useState } from "react";

import { CHAT_RETENTION_DAYS, CHAT_RETENTION_NOTICE } from "@/lib/chat/retention";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

type LeadChatResponse = {
  ok: boolean;
  data?: {
    lead: {
      id: string;
      name: string;
      phone: string;
      created_at: string;
    };
    messages: ChatMessage[];
    retentionDays: number;
  };
  error?: {
    message: string;
  };
};

type LeadChatModalProps = {
  leadId: string;
  onClose: () => void;
};

export function LeadChatModal({ leadId, onClose }: LeadChatModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leadName, setLeadName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadCreatedAt, setLeadCreatedAt] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    let isMounted = true;

    async function loadChat() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/dashboard/leads/${leadId}/messages`);
        const result = (await response.json()) as LeadChatResponse;

        if (!response.ok || !result.ok || !result.data) {
          throw new Error(result.error?.message ?? "Could not load chat.");
        }

        if (!isMounted) {
          return;
        }

        setLeadName(result.data.lead.name);
        setLeadPhone(result.data.lead.phone);
        setLeadCreatedAt(result.data.lead.created_at);
        setMessages(result.data.messages);
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error ? loadError.message : "Could not load chat.",
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadChat();

    return () => {
      isMounted = false;
    };
  }, [leadId]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col border border-zinc-300 bg-white shadow-lg"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-chat-title"
      >
        <header className="border-b border-zinc-300 px-4 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="lead-chat-title" className="text-lg font-semibold">
                {leadName || "Lead chat"}
              </h2>
              {leadPhone ? (
                <p className="mt-1 text-sm text-zinc-600">{leadPhone}</p>
              ) : null}
              {leadCreatedAt ? (
                <p className="mt-1 text-xs text-zinc-500">
                  Lead captured: {new Date(leadCreatedAt).toLocaleString()}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-100"
            >
              Close
            </button>
          </div>
          <p className="mt-3 text-xs text-zinc-500">{CHAT_RETENTION_NOTICE}</p>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {loading ? (
            <p className="text-sm text-zinc-600">Loading chat...</p>
          ) : null}

          {error ? <p className="text-sm text-red-700">{error}</p> : null}

          {!loading && !error && messages.length === 0 ? (
            <p className="rounded-xl bg-zinc-100 px-4 py-3 text-sm text-zinc-700">
              No messages in the last {CHAT_RETENTION_DAYS} days.
            </p>
          ) : null}

          {!loading && !error
            ? messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                      message.role === "user"
                        ? "bg-zinc-900 text-white"
                        : "bg-zinc-100 text-zinc-800"
                    }`}
                  >
                    <p>{message.content}</p>
                    <p
                      className={`mt-2 text-xs ${
                        message.role === "user" ? "text-zinc-300" : "text-zinc-500"
                      }`}
                    >
                      {new Date(message.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            : null}
        </div>

        <footer className="border-t border-zinc-300 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full border border-zinc-900 bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700"
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}
