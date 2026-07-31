"use client";

import { useEffect, useRef, useState } from "react";

import { fetchMessages, sendChatMessage, type ChatMessage } from "@/lib/api/client";
import type { BusinessDisplay } from "@/lib/business/display";

type ChatInterfaceProps = {
  botId: string;
  sessionId: string;
  business: BusinessDisplay;
  parentPageUrl?: string | null;
};

export function ChatInterface({
  botId,
  sessionId,
  business,
  parentPageUrl,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadHistory() {
      try {
        const history = await fetchMessages({ botId, sessionId });

        if (isMounted) {
          setMessages(history);
        }
      } catch {
        if (isMounted) {
          setMessages([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingHistory(false);
        }
      }
    }

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, [botId, sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedMessage = input.trim();

    if (!trimmedMessage || isSending) {
      return;
    }

    setIsSending(true);
    setInput("");

    try {
      const result = await sendChatMessage({
        botId,
        sessionId,
        message: trimmedMessage,
        pageUrl:
          parentPageUrl ??
          (typeof window !== "undefined" ? window.location.href : undefined),
      });

      setMessages(result.messages);
    } catch (sendError) {
      setInput(trimmedMessage);
      setError(
        sendError instanceof Error
          ? sendError.message
          : "Could not send your message.",
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="border-b border-border bg-card px-4 py-4 shadow-sm">
        <h1 className="text-lg font-semibold tracking-tight text-foreground">
          {business.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {business.chatWelcomeMessage}
        </p>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {isLoadingHistory ? (
          <p className="rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground shadow-sm">
            Loading conversation…
          </p>
        ) : null}

        {!isLoadingHistory && messages.length === 0 ? (
          <p className="rounded-2xl bg-muted px-4 py-3 text-sm text-foreground shadow-sm">
            {business.chatWelcomeMessage}
          </p>
        ) : null}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-foreground"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}

        {isSending ? (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-border bg-muted px-4 py-3 text-sm text-muted-foreground shadow-sm">
              Thinking…
            </div>
          </div>
        ) : null}

        <div ref={bottomRef} />
      </div>

      {error ? (
        <p className="px-4 pb-2 text-sm text-destructive">{error}</p>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="border-t border-border bg-card px-4 py-4 shadow-[0_-4px_12px_rgba(0,0,0,0.04)]"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Type your question…"
            className="flex-1 rounded-full border border-input bg-background px-4 py-2.5 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            className="rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-md transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
