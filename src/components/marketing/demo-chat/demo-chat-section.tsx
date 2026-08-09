"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { MessageCircleMore } from "lucide-react";

import { WidgetThemeProvider } from "@/components/chatbot/widget-theme-provider";
import { DemoChatInterface } from "@/components/marketing/demo-chat/demo-chat-interface";
import { demoBusiness, demoWidgetSettings } from "@/lib/demo/config";
import { getOrCreateDemoSessionId } from "@/lib/session/demo-client";
import { cn } from "@/lib/utils";

function subscribe() {
  return () => {};
}

function getClientSessionId() {
  return getOrCreateDemoSessionId();
}

function getServerSessionId() {
  return "demo-static";
}

export function DemoChatSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [canCloseBackdrop, setCanCloseBackdrop] = useState(false);
  const justOpenedRef = useRef(false);
  const sessionId = useSyncExternalStore(
    subscribe,
    getClientSessionId,
    getServerSessionId,
  );

  const openChat = useCallback(() => {
    justOpenedRef.current = true;
    setIsOpen(true);

    window.setTimeout(() => {
      justOpenedRef.current = false;
    }, 400);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setCanCloseBackdrop(false);
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const timer = window.setTimeout(() => {
      setCanCloseBackdrop(true);
    }, 350);

    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const handleBackdropClose = useCallback(() => {
    if (justOpenedRef.current || !canCloseBackdrop) {
      return;
    }

    closeChat();
  }, [canCloseBackdrop, closeChat]);

  const modal =
    isOpen && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-5 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-label="Live demo chat"
          >
            <button
              type="button"
              aria-label="Close chat backdrop"
              className={cn(
                "absolute inset-0 bg-black/40",
                !canCloseBackdrop && "pointer-events-none",
              )}
              onClick={handleBackdropClose}
              tabIndex={-1}
            />
            <div
              className={cn(
                "relative z-10 flex w-full max-w-[380px] flex-col overflow-hidden",
                "h-[min(75vh,620px)] min-h-[400px] rounded-2xl",
                "shadow-[0_12px_40px_rgba(17,36,55,0.25)]",
              )}
            >
              <WidgetThemeProvider settings={demoWidgetSettings}>
                <DemoChatInterface
                  sessionId={sessionId}
                  business={demoBusiness}
                  widgetSettings={demoWidgetSettings}
                  onClose={closeChat}
                />
              </WidgetThemeProvider>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <div className="flex w-full flex-col items-center gap-4 py-2">
        <p className="text-sm font-medium text-[var(--landing-navy)]/80">
          Tap the chat icon to start the demo
        </p>
        <button
          type="button"
          onClick={openChat}
          className={cn(
            "inline-flex size-16 cursor-pointer touch-manipulation items-center justify-center rounded-full",
            "bg-[#FC7B02] text-white shadow-[0_8px_24px_rgba(252,123,2,0.45)]",
            "ring-4 ring-white transition-transform active:scale-95",
          )}
          style={{ WebkitTapHighlightColor: "transparent" }}
          aria-label="Open live demo chat"
          aria-expanded={isOpen}
        >
          <MessageCircleMore
            className="pointer-events-none size-7"
            aria-hidden="true"
          />
        </button>
      </div>
      {modal}
    </>
  );
}
