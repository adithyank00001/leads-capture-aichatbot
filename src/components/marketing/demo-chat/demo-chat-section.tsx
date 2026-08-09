"use client";

import { useEffect, useState } from "react";

import { ChatLauncher } from "@/components/chatbot/chat-launcher";
import { WidgetThemeProvider } from "@/components/chatbot/widget-theme-provider";
import { DemoChatInterface } from "@/components/marketing/demo-chat/demo-chat-interface";
import { demoBusiness, demoWidgetSettings } from "@/lib/demo/config";
import { getOrCreateDemoSessionId } from "@/lib/session/demo-client";
import { cn } from "@/lib/utils";

export function DemoChatSection() {
  const [sessionId, setSessionId] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setSessionId(getOrCreateDemoSessionId());
  }, []);

  if (!sessionId) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed right-4 z-50 sm:right-6",
        "bottom-24 lg:bottom-6",
      )}
      aria-label="Live demo chatbot"
    >
      <div
        className={cn(
          "transition-[width,height] duration-200 ease-out",
          isOpen
            ? "h-[min(100dvh-7rem,620px)] w-[min(100vw-2rem,380px)] rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.18)]"
            : "size-14",
        )}
      >
        <WidgetThemeProvider settings={demoWidgetSettings}>
          {!isOpen ? (
            <ChatLauncher onOpen={() => setIsOpen(true)} />
          ) : (
            <DemoChatInterface
              sessionId={sessionId}
              business={demoBusiness}
              widgetSettings={demoWidgetSettings}
              onClose={() => setIsOpen(false)}
            />
          )}
        </WidgetThemeProvider>
      </div>
    </div>
  );
}
