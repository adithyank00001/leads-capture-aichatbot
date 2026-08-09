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
const DEMO_SECTION_ID = "landing-demo";

function useDemoSectionReached() {
  const [hasReachedDemoSection, setHasReachedDemoSection] = useState(false);

  useEffect(() => {
    const demoSection = document.getElementById(DEMO_SECTION_ID);

    if (!demoSection) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) {
          return;
        }

        if (entry.isIntersecting) {
          setHasReachedDemoSection(true);
          return;
        }

        const { top, bottom } = entry.boundingClientRect;

        if (bottom < 0) {
          setHasReachedDemoSection(true);
          return;
        }

        if (top > window.innerHeight) {
          setHasReachedDemoSection(false);
        }
      },
      { threshold: 0 },
    );

    observer.observe(demoSection);

    return () => {
      observer.disconnect();
    };
  }, []);

  return hasReachedDemoSection;
}

type DemoChatPanelProps = {
  sessionId: string;
  onClose: () => void;
  className?: string;
};

function DemoChatPanel({ sessionId, onClose, className }: DemoChatPanelProps) {
  return (
    <div className={cn("flex flex-col overflow-hidden", className)}>
      <WidgetThemeProvider settings={demoWidgetSettings}>
        <DemoChatInterface
          sessionId={sessionId}
          business={demoBusiness}
          widgetSettings={demoWidgetSettings}
          onClose={onClose}
        />
      </WidgetThemeProvider>
    </div>
  );
}

export function DemoChatSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [canCloseBackdrop, setCanCloseBackdrop] = useState(false);
  const [launcherBottomPx, setLauncherBottomPx] = useState<number | null>(null);
  const hasReachedDemoSection = useDemoSectionReached();
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

    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;

    if (isDesktop) {
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
    !isOpen && hasReachedDemoSection && typeof document !== "undefined"
      ? createPortal(
          <div
            className={cn(
              "fixed right-4 z-[100] size-14 touch-manipulation transition-opacity duration-300 sm:right-6",
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

  const mobileModal =
    isOpen && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 z-[9999] lg:hidden"
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
              <DemoChatPanel
                sessionId={sessionId}
                onClose={closeChat}
                className={cn(
                  "relative z-10 h-full w-full max-w-[380px]",
                  "max-h-[620px] rounded-2xl shadow-xl",
                )}
              />
            </div>
          </div>,
          document.body,
        )
      : null;

  const desktopPanel =
    isOpen && typeof document !== "undefined"
      ? createPortal(
          <div
            className={cn(
              "fixed right-6 bottom-6 z-[9999] hidden lg:block",
              "h-[min(620px,calc(100vh-3rem))] w-[min(380px,calc(100vw-3rem))]",
              "max-h-[620px] max-w-[380px]",
            )}
            role="dialog"
            aria-modal="false"
            aria-label="Live demo chat"
          >
            <DemoChatPanel
              sessionId={sessionId}
              onClose={closeChat}
              className="h-full w-full rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.18)]"
            />
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
      {mobileModal}
      {desktopPanel}
    </>
  );
}
