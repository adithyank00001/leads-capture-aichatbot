"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

import { BusinessAvatar } from "@/components/chatbot/business-avatar";
import { ChatWidgetShell } from "@/components/chatbot/chat-widget-shell";
import { DemoAssistantMessage } from "@/components/marketing/demo-chat/demo-assistant-message";
import { DemoChatFloatingCta } from "@/components/marketing/demo-chat/demo-chat-floating-cta";
import { DemoLeadCaptureStrip } from "@/components/marketing/demo-chat/demo-lead-capture-strip";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { sendDemoChatMessage } from "@/lib/api/demo-client";
import type { BusinessDisplay } from "@/lib/business/display";
import { formatChatTimestamp } from "@/lib/chat/format";
import {
  AI_HISTORY_LIMIT,
  AI_THINKING_PHASE_MS,
  DEMO_LEAD_GATE_THINKING_MS,
  DEMO_FLOATING_CTA_DELAY_MS,
  DEMO_WAITING_MESSAGES,
} from "@/lib/demo/constants";
import { demoStarterQuestion } from "@/lib/demo/config";
import {
  createDemoMessageId,
  hasCompletedDemoLead,
  hasShownDemoFloatingCta,
  loadDemoMessages,
  markDemoFloatingCtaShown,
  markDemoLeadCompleted,
  saveDemoMessages,
  type DemoChatMessage,
} from "@/lib/session/demo-client";
import type { WidgetSettings } from "@/lib/widget/types";
import { cn } from "@/lib/utils";

const PENDING_MESSAGE_ID = "pending-user-message";

function restoreDemoChatState(sessionId: string, leadFormEnabled: boolean) {
  if (typeof window === "undefined") {
    return {
      messages: [] as DemoChatMessage[],
      input: demoStarterQuestion,
      leadCompleted: !leadFormEnabled,
      showLeadStrip: false,
      pendingMessage: null as string | null,
      showFloatingCta: false,
    };
  }

  const loadedMessages = loadDemoMessages(sessionId);
  const completed = leadFormEnabled ? hasCompletedDemoLead(sessionId) : true;
  const pendingMessageEntry = loadedMessages.find(
    (message) => message.id === PENDING_MESSAGE_ID,
  );

  return {
    messages: loadedMessages,
    input: loadedMessages.length === 0 ? demoStarterQuestion : "",
    leadCompleted: completed,
    showLeadStrip: Boolean(pendingMessageEntry && !completed),
    pendingMessage: pendingMessageEntry?.content ?? null,
    showFloatingCta: hasShownDemoFloatingCta(sessionId),
  };
}

type DemoChatInterfaceProps = {
  sessionId: string;
  business: BusinessDisplay;
  widgetSettings: WidgetSettings;
  onClose?: () => void;
};

function TypingIndicator({ businessName }: { businessName: string }) {
  return (
    <div className="flex items-start gap-2">
      <BusinessAvatar name={businessName} size="sm" className="mt-1" />
      <div className="rounded-2xl bg-blue-50 px-4 py-3">
        <div className="flex items-center gap-1">
          <span className="size-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:0ms]" />
          <span className="size-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:150ms]" />
          <span className="size-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

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
  const leadFormEnabled = widgetSettings.leadFormEnabled;
  const initialStateRef = useRef(
    restoreDemoChatState(sessionId, leadFormEnabled),
  );
  const initialState = initialStateRef.current;

  const [messages, setMessages] = useState<DemoChatMessage[]>(
    initialState.messages,
  );
  const [input, setInput] = useState(initialState.input);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [waitingPhase, setWaitingPhase] = useState<"thinking" | "stillWorking">(
    "thinking",
  );
  const [leadCompleted, setLeadCompleted] = useState(initialState.leadCompleted);
  const [showLeadStrip, setShowLeadStrip] = useState(initialState.showLeadStrip);
  const [isLeadGateThinking, setIsLeadGateThinking] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(
    initialState.pendingMessage,
  );
  const [retryMessage, setRetryMessage] = useState<string | null>(null);
  const [showFloatingCta, setShowFloatingCta] = useState(
    initialState.showFloatingCta,
  );
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const leadGateTimerRef = useRef<number | null>(null);
  const floatingCtaTimerRef = useRef<number | null>(null);

  const assistantLabel = `${business.name} assistant`;

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    saveDemoMessages(sessionId, messages);
  }, [messages, sessionId]);

  useEffect(() => {
    if (!showFloatingCta) {
      return;
    }

    markDemoFloatingCtaShown(sessionId);
  }, [showFloatingCta, sessionId]);

  useEffect(() => {
    if (showFloatingCta) {
      return;
    }

    if (!messages.some((message) => message.role === "assistant")) {
      return;
    }

    if (floatingCtaTimerRef.current !== null) {
      return;
    }

    floatingCtaTimerRef.current = window.setTimeout(() => {
      setShowFloatingCta(true);
      floatingCtaTimerRef.current = null;
    }, DEMO_FLOATING_CTA_DELAY_MS);

    return () => {
      if (floatingCtaTimerRef.current !== null) {
        window.clearTimeout(floatingCtaTimerRef.current);
        floatingCtaTimerRef.current = null;
      }
    };
  }, [messages, showFloatingCta]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending, isLeadGateThinking, showLeadStrip, error, showFloatingCta]);

  useEffect(() => {
    return () => {
      if (leadGateTimerRef.current !== null) {
        window.clearTimeout(leadGateTimerRef.current);
      }

      if (floatingCtaTimerRef.current !== null) {
        window.clearTimeout(floatingCtaTimerRef.current);
      }
    };
  }, []);

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

    if (isSending || isLeadGateThinking) {
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
      setInput("");
      setIsLeadGateThinking(true);

      if (leadGateTimerRef.current !== null) {
        window.clearTimeout(leadGateTimerRef.current);
      }

      leadGateTimerRef.current = window.setTimeout(() => {
        setIsLeadGateThinking(false);
        setShowLeadStrip(true);
        leadGateTimerRef.current = null;
      }, DEMO_LEAD_GATE_THINKING_MS);

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
    displayMessages.length === 0 &&
    !isSending &&
    !isLeadGateThinking &&
    !showLeadStrip;
  const timestampLabel = formatChatTimestamp(new Date());

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ChatWidgetShell businessName={business.name} onClose={onClose}>
      <div className="relative flex min-h-0 flex-1 flex-col">
      <ScrollArea
        className={cn("min-h-0 flex-1 bg-white", showFloatingCta && "pb-24")}
      >
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
                    {isUser ? (
                      message.content
                    ) : (
                      <DemoAssistantMessage content={message.content} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {isLeadGateThinking ? (
            <TypingIndicator businessName={business.name} />
          ) : null}

          {isSending ? (
            <WaitingIndicator
              businessName={business.name}
              waitingPhase={waitingPhase}
            />
          ) : null}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <div className="relative shrink-0">
        {showFloatingCta ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-full z-10 flex justify-center px-4 pb-2 animate-in slide-in-from-bottom-6 fade-in duration-500">
            <div className="pointer-events-auto">
              <DemoChatFloatingCta />
            </div>
          </div>
        ) : null}

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
        className="border-t border-zinc-200 bg-white px-4 py-3 shadow-[0_-6px_20px_rgba(17,36,55,0.08)]"
      >
        <label
          htmlFor="demo-chat-input"
          className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500"
        >
          Your message
        </label>
        <div className="flex items-center gap-2 rounded-2xl border-2 border-zinc-200 bg-zinc-50 px-3 py-1.5 shadow-inner transition-colors focus-within:border-[var(--widget-accent)] focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(252,123,2,0.12)]">
          <input
            id="demo-chat-input"
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about properties, pricing, locations..."
            className="min-w-0 flex-1 bg-transparent py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 disabled:cursor-not-allowed disabled:text-zinc-400"
            disabled={
              isSending ||
              isLeadGateThinking ||
              (showLeadStrip && !leadCompleted)
            }
          />
          <Button
            type="submit"
            variant="widgetAccent"
            size="icon-sm"
            disabled={
              isSending ||
              isLeadGateThinking ||
              !input.trim() ||
              (showLeadStrip && !leadCompleted)
            }
            className="size-9 shrink-0 rounded-full shadow-sm"
            aria-label="Send message"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </form>
      </div>
      </div>
      </ChatWidgetShell>
    </div>
  );
}
