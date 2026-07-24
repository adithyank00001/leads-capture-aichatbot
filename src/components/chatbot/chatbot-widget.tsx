"use client";

import { useEffect, useState } from "react";

import { ChatInterface } from "@/components/chatbot/chat-interface";
import { LeadForm } from "@/components/chatbot/lead-form";
import type { BusinessDisplay } from "@/lib/business/display";
import {
  getOrCreateSessionId,
  hasCompletedLead,
} from "@/lib/session/client";

type ChatbotWidgetProps = {
  botId: string;
  business: BusinessDisplay;
};

export function ChatbotWidget({ botId, business }: ChatbotWidgetProps) {
  const [sessionId, setSessionId] = useState("");
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    const id = getOrCreateSessionId(botId);
    setSessionId(id);
    setShowChat(hasCompletedLead(botId, id));
  }, [botId]);

  if (!sessionId) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-zinc-500">
        Loading chatbot...
      </div>
    );
  }

  if (!showChat) {
    return (
      <LeadForm
        botId={botId}
        sessionId={sessionId}
        business={business}
        onSuccess={() => setShowChat(true)}
      />
    );
  }

  return (
    <ChatInterface
      botId={botId}
      sessionId={sessionId}
      business={business}
    />
  );
}
