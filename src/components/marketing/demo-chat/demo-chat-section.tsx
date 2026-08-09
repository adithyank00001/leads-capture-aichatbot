"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { ChevronRight } from "lucide-react";

import { ChatLauncher } from "@/components/chatbot/chat-launcher";
import { WidgetThemeProvider } from "@/components/chatbot/widget-theme-provider";
import { DemoChatInterface } from "@/components/marketing/demo-chat/demo-chat-interface";
import { demoBusiness, demoWidgetSettings } from "@/lib/demo/config";
import {
  getOrCreateDemoSessionId,
  hasCompletedDemoLead,
  loadDemoMessages,
} from "@/lib/session/demo-client";
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
const HINT_VISIBLE_MS = 6000;
const HINT_ENTER_MS = 500;
const HINT_EXIT_MS = 350;

type LauncherHintPhase = "idle" | "enter" | "visible" | "exit" | "done";

const DEMO_LAUNCHER_PULSE_EVENT = "demo-chat-pulse-launcher";
const LAUNCHER_PULSE_MS = 1650;

export function DemoTryButton({ className }: { className?: string }) {
  function handleClick() {
    window.dispatchEvent(new CustomEvent(DEMO_LAUNCHER_PULSE_EVENT));
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "mt-1.5 inline-flex items-center justify-center gap-1 rounded-[13px] bg-gradient-to-b from-[#E36F02] to-[#FDA85A] px-3.5 py-1.5 text-[14px] font-semibold text-white shadow-[0px_2px_10.1px_0px_#FC7B0233] transition-transform hover:scale-[1.04] sm:mt-2 sm:gap-1.5 sm:px-4 sm:py-2 sm:text-[15px]",
        className,
      )}
    >
      Try a demo
      <ChevronRight className="size-4 shrink-0" />
    </button>
  );
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

function hasExistingDemoSession() {
  if (typeof window === "undefined") {
    return false;
  }

  const sessionId = getOrCreateDemoSessionId();

  return (
    loadDemoMessages(sessionId).length > 0 || hasCompletedDemoLead(sessionId)
  );
}

function DemoChatLauncherHint({
  onOpen,
  phase,
}: {
  onOpen: () => void;
  phase: LauncherHintPhase;
}) {
  const expanded = phase === "enter" || phase === "visible";
  const isInteractive = expanded;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "absolute bottom-[calc(100%+12px)] right-4 z-10 w-max max-w-[min(210px,calc(100vw-5.5rem))] origin-bottom-right overflow-visible text-left sm:right-6 sm:max-w-[230px]",
        "transition-[transform,opacity] will-change-transform",
        expanded
          ? "pointer-events-auto translate-x-0 translate-y-0 scale-100 opacity-100"
          : "pointer-events-none translate-x-3 translate-y-4 scale-[0.18] opacity-0",
        phase === "enter" &&
          "duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
        phase === "visible" && "duration-300 ease-out",
        phase === "exit" && "duration-350 ease-in",
        (phase === "idle" || phase === "done") && "duration-0",
      )}
      aria-hidden={!isInteractive}
      tabIndex={isInteractive ? 0 : -1}
      aria-label="See how it captures a lead"
    >
      <span className="relative block overflow-visible rounded-3xl border border-black/10 bg-[#E2E8EF] px-3.5 py-2 text-[13px] font-semibold leading-snug tracking-tight text-[#112437] shadow-[0_0_0_0.5px_rgba(0,0,0,0.18),0_4px_14px_rgba(17,36,55,0.08)] sm:rounded-full sm:px-4 sm:py-2.5 sm:text-[14px] sm:whitespace-nowrap">
        See How It Captures a Lead
        <span
          className="absolute bottom-0 right-3 block size-2.5 translate-x-0.5 translate-y-[48%] rotate-[28deg] border-b border-r border-black/10 bg-[#E2E8EF]"
          aria-hidden
        />
      </span>
    </button>
  );
}

export function DemoChatSection() {
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isChatMounted, setIsChatMounted] = useState(false);
  const [canCloseBackdrop, setCanCloseBackdrop] = useState(false);
  const [launcherBottomPx, setLauncherBottomPx] = useState<number | null>(null);
  const [hintPhase, setHintPhase] = useState<LauncherHintPhase>("idle");
  const [launcherPulsing, setLauncherPulsing] = useState(false);
  const justOpenedRef = useRef(false);
  const hintPlayedRef = useRef(false);
  const hintTimersRef = useRef<number[]>([]);
  const launcherPulseTimerRef = useRef<number | null>(null);
  const sessionId = useSyncExternalStore(
    subscribe,
    getClientSessionId,
    getServerSessionId,
  );

  const openChat = useCallback(() => {
    justOpenedRef.current = true;
    setIsChatMounted(true);
    setIsOpen(true);

    window.setTimeout(() => {
      justOpenedRef.current = false;
    }, 400);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (hasExistingDemoSession()) {
      setIsChatMounted(true);
    }
  }, []);

  useEffect(() => {
    function handleLauncherPulse() {
      if (launcherPulseTimerRef.current !== null) {
        window.clearTimeout(launcherPulseTimerRef.current);
      }

      setLauncherPulsing(false);

      window.requestAnimationFrame(() => {
        setLauncherPulsing(true);
        launcherPulseTimerRef.current = window.setTimeout(() => {
          setLauncherPulsing(false);
          launcherPulseTimerRef.current = null;
        }, LAUNCHER_PULSE_MS);
      });
    }

    window.addEventListener(DEMO_LAUNCHER_PULSE_EVENT, handleLauncherPulse);

    return () => {
      window.removeEventListener(DEMO_LAUNCHER_PULSE_EVENT, handleLauncherPulse);

      if (launcherPulseTimerRef.current !== null) {
        window.clearTimeout(launcherPulseTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const demoStartHint = document.getElementById("landing-demo");

    if (!demoStartHint) {
      return;
    }

    function clearHintTimers() {
      hintTimersRef.current.forEach((timer) => {
        window.clearTimeout(timer);
      });
      hintTimersRef.current = [];
    }

    function scheduleHintTimers(reducedMotion: boolean) {
      clearHintTimers();

      const enterMs = reducedMotion ? 0 : HINT_ENTER_MS;
      const exitMs = reducedMotion ? 0 : HINT_EXIT_MS;

      setHintPhase("enter");

      hintTimersRef.current.push(
        window.setTimeout(() => {
          setHintPhase("visible");
        }, enterMs),
      );

      hintTimersRef.current.push(
        window.setTimeout(() => {
          setHintPhase("exit");
        }, enterMs + HINT_VISIBLE_MS),
      );

      hintTimersRef.current.push(
        window.setTimeout(
          () => {
            setHintPhase("done");
          },
          enterMs + HINT_VISIBLE_MS + exitMs,
        ),
      );
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (!entry?.isIntersecting || hintPlayedRef.current) {
          return;
        }

        hintPlayedRef.current = true;
        observer.disconnect();

        const reducedMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;

        scheduleHintTimers(reducedMotion);
      },
      { threshold: 0.75, rootMargin: "0px 0px -5% 0px" },
    );

    observer.observe(demoStartHint);

    return () => {
      observer.disconnect();
      clearHintTimers();
    };
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

      setLauncherBottomPx(
        stickyCta.getBoundingClientRect().height + LAUNCHER_GAP_PX,
      );
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
    isMounted && !isOpen
      ? createPortal(
          <div
            className={cn(
              "fixed right-4 z-[100] touch-manipulation sm:right-6",
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
            <div
              className={cn(
                "relative size-14 shrink-0",
                launcherPulsing && "animate-demo-launcher-pulse",
              )}
            >
              <DemoChatLauncherHint onOpen={openChat} phase={hintPhase} />
              <WidgetThemeProvider settings={demoWidgetSettings}>
                <ChatLauncher onOpen={openChat} />
              </WidgetThemeProvider>
            </div>
          </div>,
          document.body,
        )
      : null;

  const mobileModal =
    isMounted && isChatMounted
      ? createPortal(
          <div
            className={cn(
              "fixed inset-0 z-[9999] lg:hidden",
              !isOpen && "hidden",
            )}
            role="dialog"
            aria-modal={isOpen}
            aria-hidden={!isOpen}
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
    isMounted && isChatMounted
      ? createPortal(
          <div
            className={cn(
              "fixed right-6 bottom-6 z-[9999] hidden lg:block",
              "h-[min(620px,calc(100vh-3rem))] w-[min(380px,calc(100vw-3rem))]",
              "max-h-[620px] max-w-[380px]",
              !isOpen && "pointer-events-none invisible",
            )}
            role="dialog"
            aria-modal={false}
            aria-hidden={!isOpen}
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
      {launcher}
      {mobileModal}
      {desktopPanel}
    </>
  );
}
