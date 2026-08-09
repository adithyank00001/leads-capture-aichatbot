"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

import { BusinessAvatar } from "@/components/chatbot/business-avatar";
import { ChatWidgetShell } from "@/components/chatbot/chat-widget-shell";
import { DemoLeadCaptureStrip } from "@/components/marketing/demo-chat/demo-lead-capture-strip";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { sendDemoChatMessage } from "@/lib/api/demo-client";
import type { BusinessDisplay } from "@/lib/business/display";
import { formatChatTimestamp } from "@/lib/chat/format";
import {
  AI_HISTORY_LIMIT,
  AI_THINKING_PHASE_MS,
  DEMO_WAITING_MESSAGES,
} from "@/lib/demo/constants";
import {
  createDemoMessageId,
  hasCompletedDemoLead,
  loadDemoMessages,
  markDemoLeadCompleted,
  saveDemoMessages,
  type DemoChatMessage,
} from "@/lib/session/demo-client";
import type { WidgetSettings } from "@/lib/widget/types";

const PENDING_MESSAGE_ID = "pending-user-message";

type DemoChatInterfaceProps = {
  sessionId: string;
  business: BusinessDisplay;
  widgetSettings: WidgetSettings;
  onClose: () => void;
};

function WaitingIndicator({
  businessName,
  waitingPhase,
}: {
  businessName: string;
  waitingPhase: "thinking" | "stillWorking";
}) {
  const label =
    waitingPhase === "thinking"
      ? DEMO_WAITING_MESSAGES.thinking
      : DEMO_WAITING_MESSAGES.stillWorking;

  return (
    <div className="flex items-start gap-2">
      <BusinessAvatar name={businessName} size="sm" className="mt-1" />
      <div className="rounded-2xl bg-blue-50 px-4 py-3 text-sm text-zinc-600">
        {label}
      </div>
    </div>
  );
}

export function DemoChatInterface({
  sessionId,
  business,
  widgetSettings,
  onClose,
}: DemoChatInterfaceProps) {
  const [messages, setMessages] = useState<DemoChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [waitingPhase, setWaitingPhase] = useState<"thinking" | "stillWorking">(
    "thinking",
  );
  const [leadCompleted, setLeadCompleted] = useState(false);
  const [showLeadStrip, setShowLeadStrip] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const assistantLabel = `${business.name} assistant`;
  const leadFormEnabled = widgetSettings.leadFormEnabled;

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    if (!leadFormEnabled) {
      setLeadCompleted(true);
      return;
    }

    setLeadCompleted(hasCompletedDemoLead(sessionId));
  }, [sessionId, leadFormEnabled]);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    setMessages(loadDemoMessages(sessionId));
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    saveDemoMessages(sessionId, messages);
  }, [messages, sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending, showLeadStrip, error]);

  useEffect(() => {
    if (!isSending) {
      setWaitingPhase("thinking");
      return;
    }

    setWaitingPhase("thinking");

    const timer = window.setTimeout(() => {
      setWaitingPhase("stillWorking");
    }, AI_THINKING_PHASE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isSending]);

  function toHistoryPayload(items: DemoChatMessage[]) {
    return items
      .filter((message) => message.id !== PENDING_MESSAGE_ID)
      .slice(-AI_HISTORY_LIMIT)
      .map((message) => ({
        role: message.role,
        content: message.content,
      }));
  }

  async function sendMessageToApi(message: string, existingMessages: DemoChatMessage[]) {
    setIsSending(true);
    setError(null);
    setRetryMessage(null);

    const userMessage: DemoChatMessage = {
      id: createDemoMessageId(),
      role: "user",
      content: message,
      created_at: new Date().toISOString(),
    };

    const nextMessages = [...existingMessages, userMessage];
    setMessages(nextMessages);

    try {
      const result = await sendDemoChatMessage({
        sessionId,
        message,
        history: toHistoryPayload(existingMessages),
      });

      const assistantMessage: DemoChatMessage = {
        id: createDemoMessageId(),
        role: "assistant",
        content: result.answer,
        created_at: new Date().toISOString(),
      };

      setMessages([...nextMessages, assistantMessage]);
      setPendingMessage(null);
    } catch (sendError) {
      setMessages(existingMessages);
      const messageText =
        sendError instanceof Error
          ? sendError.message
          : DEMO_WAITING_MESSAGES.timeout;

      setError(messageText);
      setRetryMessage(message);
      throw sendError;
    } finally {
      setIsSending(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSending) {
      return;
    }

    setError(null);

    const trimmedMessage = input.trim();

    if (!trimmedMessage) {
      return;
    }

    if (!leadCompleted && leadFormEnabled) {
      if (showLeadStrip) {
        setError("Please continue with the demo details below.");
        return;
      }

      const optimisticMessage: DemoChatMessage = {
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
      await sendMessageToApi(trimmedMessage, messages);
    } catch {
      setInput(trimmedMessage);
    }
  }

  async function handleLeadSuccess() {
    markDemoLeadCompleted(sessionId);
    setLeadCompleted(true);
    setShowLeadStrip(false);

    if (!pendingMessage) {
      return;
    }

    const messageToSend = pendingMessage;

    try {
      await sendMessageToApi(messageToSend, []);
    } catch {
      setInput(messageToSend);
      setPendingMessage(null);
    }
  }

  async function handleRetry() {
    if (!retryMessage || isSending) {
      return;
    }

    try {
      await sendMessageToApi(retryMessage, messages);
    } catch {
      // Error state is already set by sendMessageToApi.
    }
  }

  const displayMessages = messages;
  const showWelcome =
    displayMessages.length === 0 && !isSending && !showLeadStrip;
  const timestampLabel = formatChatTimestamp(new Date());

  return (
    <ChatWidgetShell businessName={business.name} onClose={onClose}>
      <ScrollArea className="min-h-0 flex-1 bg-white">
        <div className="space-y-4 px-4 py-4">
          <p className="text-center text-xs text-zinc-400">{timestampLabel}</p>

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

          {isSending ? (
            <WaitingIndicator
              businessName={business.name}
              waitingPhase={waitingPhase}
            />
          ) : null}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {error ? (
        <div className="border-t border-zinc-100 bg-zinc-50 px-4 py-3">
          <p className="text-sm text-red-600">{error}</p>
          {retryMessage ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => {
                void handleRetry();
              }}
              disabled={isSending}
            >
              Try again
            </Button>
          ) : null}
        </div>
      ) : null}

      {showLeadStrip && leadFormEnabled && !leadCompleted ? (
        <DemoLeadCaptureStrip
          leadFields={widgetSettings.leadFields}
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
      </form>
    </ChatWidgetShell>
  );
}
