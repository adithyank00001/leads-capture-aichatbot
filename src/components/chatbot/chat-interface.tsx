"use client";

import { useEffect, useRef, useState } from "react";
import { Paperclip, Send, Smile } from "lucide-react";

import { BusinessAvatar } from "@/components/chatbot/business-avatar";
import { ChatWidgetShell } from "@/components/chatbot/chat-widget-shell";
import { LeadCaptureStrip } from "@/components/chatbot/lead-capture-strip";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  fetchMessages,
  sendChatMessage,
  type ChatMessage,
} from "@/lib/api/client";
import type { BusinessDisplay } from "@/lib/business/display";
import { formatChatTimestamp } from "@/lib/chat/format";
import type { WidgetSettings } from "@/lib/widget/types";
import {
  hasCompletedLead,
  markLeadCompleted,
} from "@/lib/session/client";

const PENDING_MESSAGE_ID = "pending-user-message";

type ChatInterfaceProps = {
  botId: string;
  sessionId: string;
  business: BusinessDisplay;
  widgetSettings: WidgetSettings;
  parentPageUrl?: string | null;
  onClose: () => void;
};

function TypingIndicator({ businessName }: { businessName: string }) {
  return (
    <div className="flex items-start gap-2">
      <BusinessAvatar name={businessName} size="sm" className="mt-1" />
      <div className="rounded-2xl bg-blue-50 px-4 py-3">
        <div className="flex items-center gap-1">
          <span
            className="size-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:0ms]"
          />
          <span
            className="size-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:150ms]"
          />
          <span
            className="size-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:300ms]"
          />
        </div>
      </div>
    </div>
  );
}

export function ChatInterface({
  botId,
  sessionId,
  business,
  widgetSettings,
  parentPageUrl,
  onClose,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [leadCompleted, setLeadCompleted] = useState(false);
  const [showLeadStrip, setShowLeadStrip] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const assistantLabel = `${business.name} assistant`;
  const pageUrl =
    parentPageUrl ??
    (typeof window !== "undefined" ? window.location.href : undefined);
  const leadFormEnabled = widgetSettings.leadFormEnabled;

  useEffect(() => {
    if (!leadFormEnabled) {
      setLeadCompleted(true);
      return;
    }

    setLeadCompleted(hasCompletedLead(botId, sessionId));
  }, [botId, sessionId, leadFormEnabled]);

  useEffect(() => {
    let isMounted = true;

    async function loadHistory() {
      try {
        const history = await fetchMessages({ botId, sessionId });

        if (isMounted) {
          setMessages(history);
          if (leadFormEnabled) {
            markLeadCompleted(botId, sessionId);
            setLeadCompleted(true);
          }
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
  }, [botId, sessionId, leadFormEnabled]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending, showLeadStrip]);

  async function sendMessageToApi(message: string) {
    setIsSending(true);
    setError(null);

    try {
      const result = await sendChatMessage({
        botId,
        sessionId,
        message,
        pageUrl,
      });

      setMessages(result.messages);
      setPendingMessage(null);
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : "Could not send your message.",
      );
      throw sendError;
    } finally {
      setIsSending(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedMessage = input.trim();

    if (!trimmedMessage || isSending) {
      return;
    }

    if (!leadCompleted && leadFormEnabled) {
      if (showLeadStrip) {
        setError("Please add your details below so we can reply.");
        return;
      }

      const optimisticMessage: ChatMessage = {
        id: PENDING_MESSAGE_ID,
        role: "user",
        content: trimmedMessage,
        created_at: new Date().toISOString(),
      };

      setMessages([optimisticMessage]);
      setPendingMessage(trimmedMessage);
      setShowLeadStrip(true);
      setInput("");
      return;
    }

    setInput("");

    try {
      await sendMessageToApi(trimmedMessage);
    } catch {
      setInput(trimmedMessage);
    }
  }

  async function handleLeadSuccess() {
    markLeadCompleted(botId, sessionId);
    setLeadCompleted(true);
    setShowLeadStrip(false);

    if (!pendingMessage) {
      return;
    }

    try {
      await sendMessageToApi(pendingMessage);
    } catch {
      setInput(pendingMessage);
      setPendingMessage(null);
      setError(
        "Your details were saved. Tap send again if the reply did not appear.",
      );
    }
  }

  const displayMessages = messages;
  const showWelcome =
    !isLoadingHistory &&
    displayMessages.length === 0 &&
    !isSending &&
    !showLeadStrip;
  const timestampLabel = formatChatTimestamp(new Date());

  return (
    <ChatWidgetShell businessName={business.name} onClose={onClose}>
      <ScrollArea className="min-h-0 flex-1 bg-white">
        <div className="space-y-4 px-4 py-4">
          <p className="text-center text-xs text-zinc-400">{timestampLabel}</p>

          {isLoadingHistory ? (
            <p className="text-center text-sm text-zinc-500">
              Loading conversation…
            </p>
          ) : null}

          {showWelcome ? (
            <div className="space-y-1">
              <p className="text-xs text-zinc-400">{assistantLabel}</p>
              <div className="flex items-start gap-2">
                <BusinessAvatar name={business.name} size="sm" className="mt-1" />
                <div className="max-w-[85%] rounded-2xl bg-blue-50 px-4 py-3 text-sm leading-6 text-zinc-800">
                  {business.chatWelcomeMessage}
                </div>
              </div>
            </div>
          ) : null}

          {displayMessages.map((message) => {
            const isUser = message.role === "user";

            return (
              <div key={message.id} className="space-y-1">
                <p
                  className={`text-xs text-zinc-400 ${
                    isUser ? "text-right" : "text-left"
                  }`}
                >
                  {isUser ? "You" : assistantLabel}
                </p>
                <div
                  className={`flex items-start gap-2 ${
                    isUser ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {!isUser ? (
                    <BusinessAvatar
                      name={business.name}
                      size="sm"
                      className="mt-1"
                    />
                  ) : null}
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 text-zinc-800 ${
                      isUser ? "bg-amber-50" : "bg-blue-50"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              </div>
            );
          })}

          {isSending ? <TypingIndicator businessName={business.name} /> : null}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {error ? (
        <p className="px-4 pb-2 text-sm text-red-600">{error}</p>
      ) : null}

      {showLeadStrip && leadFormEnabled && !leadCompleted ? (
        <LeadCaptureStrip
          botId={botId}
          sessionId={sessionId}
          leadFields={widgetSettings.leadFields}
          parentPageUrl={parentPageUrl}
          onSuccess={() => {
            void handleLeadSuccess();
          }}
        />
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="border-t border-zinc-100 bg-zinc-50 px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Type here..."
            className="min-w-0 flex-1 bg-transparent text-sm text-zinc-800 outline-none placeholder:text-zinc-400"
            disabled={isSending}
          />
          <Button
            type="submit"
            variant="widgetAccent"
            size="icon-sm"
            disabled={isSending || !input.trim()}
            className="rounded-full"
            aria-label="Send message"
          >
            <Send className="size-3.5" />
          </Button>
        </div>
        <div className="mt-2 flex items-center gap-3 text-zinc-400">
          <button
            type="button"
            className="hover:text-zinc-600"
            aria-label="Add emoji"
            tabIndex={-1}
          >
            <Smile className="size-4" />
          </button>
          <button
            type="button"
            className="hover:text-zinc-600"
            aria-label="Attach file"
            tabIndex={-1}
          >
            <Paperclip className="size-4" />
          </button>
        </div>
      </form>
    </ChatWidgetShell>
  );
}
