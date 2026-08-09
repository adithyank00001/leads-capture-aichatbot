"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";

import { ChatLauncher } from "@/components/chatbot/chat-launcher";
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

const STICKY_CTA_ID = "sticky-mobile-cta";
const LAUNCHER_GAP_PX = 16;

export function DemoChatSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [canCloseBackdrop, setCanCloseBackdrop] = useState(false);
  const [launcherBottomPx, setLauncherBottomPx] = useState<number | null>(null);
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
    function updateLauncherPosition() {
      const isDesktop = window.matchMedia("(min-width: 1024px)").matches;

      if (isDesktop) {
        setLauncherBottomPx(null);
        return;
      }

      const stickyCta = document.getElementById(STICKY_CTA_ID);

      if (!stickyCta) {
        setLauncherBottomPx(null);
        return;
      }

      setLauncherBottomPx(stickyCta.getBoundingClientRect().height + LAUNCHER_GAP_PX);
    }

    updateLauncherPosition();

    const stickyCta = document.getElementById(STICKY_CTA_ID);
    const resizeObserver =
      typeof ResizeObserver !== "undefined" && stickyCta
        ? new ResizeObserver(updateLauncherPosition)
        : null;

    resizeObserver?.observe(stickyCta!);
    window.addEventListener("resize", updateLauncherPosition);

    const desktopQuery = window.matchMedia("(min-width: 1024px)");
    desktopQuery.addEventListener("change", updateLauncherPosition);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateLauncherPosition);
      desktopQuery.removeEventListener("change", updateLauncherPosition);
    };
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

  const launcher =
    !isOpen && typeof document !== "undefined"
      ? createPortal(
          <div
            className={cn(
              "fixed right-4 z-[100] size-14 touch-manipulation sm:right-6",
              "lg:bottom-6",
              launcherBottomPx === null && "bottom-36",
            )}
            style={{
              WebkitTapHighlightColor: "transparent",
              ...(launcherBottomPx !== null
                ? { bottom: `${launcherBottomPx}px` }
                : {}),
            }}
            aria-label="Live demo chatbot"
          >
            <WidgetThemeProvider settings={demoWidgetSettings}>
              <ChatLauncher onOpen={openChat} />
            </WidgetThemeProvider>
          </div>,
          document.body,
        )
      : null;

  const modal =
    isOpen && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 z-[9999]"
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
            <div className="absolute inset-5 flex items-center justify-center sm:inset-8">
              <div
                className={cn(
                  "relative z-10 flex h-full w-full max-w-[380px] flex-col overflow-hidden",
                  "max-h-[620px] rounded-2xl shadow-xl",
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
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <p className="text-center text-sm font-medium text-[var(--landing-navy)]/80">
        Tap the chat icon in the corner to start the demo
      </p>
      {launcher}
      {modal}
    </>
  );
}
