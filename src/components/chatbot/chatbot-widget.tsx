"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ChatInterface } from "@/components/chatbot/chat-interface";
import { ChatLauncher } from "@/components/chatbot/chat-launcher";
import {
  ChatLauncherHint,
  type LauncherHintPhase,
} from "@/components/chatbot/chat-launcher-hint";
import { WidgetThemeProvider } from "@/components/chatbot/widget-theme-provider";
import type { BusinessDisplay } from "@/lib/business/display";
import { getApiPath } from "@/lib/config";
import {
  resolveParentPageUrl,
  setParentPageUrl,
} from "@/lib/embed/parent-page";
import { postWidgetResize, PARENT_VIEWPORT_MESSAGE_TYPE } from "@/lib/embed/widget-messages";
import { isHostAllowed, normalizeDomain } from "@/lib/security/domain-shared";
import { getOrCreateSessionId } from "@/lib/session/client";
import type { WidgetSettings } from "@/lib/widget/types";
import { cn } from "@/lib/utils";

const PARENT_PAGE_MESSAGE_TYPE = "chatbot-parent-page";
const LIVE_HINT_DELAY_MS = 10_000;
const LIVE_HINT_ENTER_MS = 500;

type ChatbotWidgetProps = {
  botId: string;
  business: BusinessDisplay;
  widgetSettings: WidgetSettings;
};

function hostFromOrigin(origin: string) {
  try {
    return new URL(origin).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function ChatbotWidget({
  botId,
  business,
  widgetSettings,
}: ChatbotWidgetProps) {
  const searchParams = useSearchParams();

  const [sessionId, setSessionId] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isTopLevel, setIsTopLevel] = useState(false);
  const [parentPageUrl, setParentPageUrlState] = useState<string | null>(null);
  const [allowedDomains, setAllowedDomains] = useState<string[]>([]);
  const [hintPhase, setHintPhase] = useState<LauncherHintPhase>("idle");
  const [isDesktopLauncher, setIsDesktopLauncher] = useState(
    () => searchParams.get("viewport") === "desktop",
  );
  const hintUnlockedRef = useRef(false);
  const hintTimersRef = useRef<number[]>([]);

  useEffect(() => {
    const viewport = searchParams.get("viewport");
    if (viewport === "desktop") {
      setIsDesktopLauncher(true);
    } else if (viewport === "mobile") {
      setIsDesktopLauncher(false);
    }
  }, [searchParams]);

  useEffect(() => {
    const topLevel = window.self === window.top;
    setIsTopLevel(topLevel);
    if (topLevel) {
      setIsOpen(true);
    }
  }, []);

  useEffect(() => {
    const id = getOrCreateSessionId(botId);
    setSessionId(id);
  }, [botId]);

  useEffect(() => {
    // Closed state always uses the large transparent launcher frame so the
    // round button is never clipped by a tiny circular iframe.
    postWidgetResize(isOpen ? "panel" : "launcher-hint");
  }, [isOpen]);

  useEffect(() => {
    function clearHintTimers() {
      hintTimersRef.current.forEach((timer) => {
        window.clearTimeout(timer);
      });
      hintTimersRef.current = [];
    }

    if (isOpen || isTopLevel) {
      clearHintTimers();
      setHintPhase("idle");
      return;
    }

    if (hintUnlockedRef.current) {
      setHintPhase("visible");
      return;
    }

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const delayTimer = window.setTimeout(() => {
      hintUnlockedRef.current = true;

      if (reducedMotion) {
        setHintPhase("visible");
        return;
      }

      setHintPhase("enter");
      hintTimersRef.current.push(
        window.setTimeout(() => {
          setHintPhase("visible");
        }, LIVE_HINT_ENTER_MS),
      );
    }, LIVE_HINT_DELAY_MS);

    hintTimersRef.current.push(delayTimer);

    return () => {
      clearHintTimers();
    };
  }, [isOpen, isTopLevel]);

  useEffect(() => {
    let cancelled = false;

    async function loadAllowedDomains() {
      try {
        const response = await fetch(
          `${getApiPath("embed-allowed-domains")}?botId=${encodeURIComponent(botId)}`,
          { cache: "no-store" },
        );
        const payload = (await response.json()) as {
          ok?: boolean;
          data?: { domains?: string[] };
        };

        if (!cancelled && payload.ok && Array.isArray(payload.data?.domains)) {
          setAllowedDomains(
            payload.data.domains
              .map((domain) => normalizeDomain(domain))
              .filter((domain): domain is string => Boolean(domain)),
          );
        }
      } catch {
        if (!cancelled) {
          setAllowedDomains([]);
        }
      }
    }

    void loadAllowedDomains();

    return () => {
      cancelled = true;
    };
  }, [botId]);

  useEffect(() => {
    const queryParentUrl = searchParams.get("parentUrl");

    if (isTopLevel) {
      setParentPageUrlState(
        resolveParentPageUrl(botId, queryParentUrl),
      );
      return;
    }

    const resolvedFromQuery = resolveParentPageUrl(botId, queryParentUrl);
    if (resolvedFromQuery) {
      setParentPageUrlState(resolvedFromQuery);
    }

    function handleMessage(event: MessageEvent) {
      if (!event.data || typeof event.data !== "object") {
        return;
      }

      if (event.data.type === PARENT_VIEWPORT_MESSAGE_TYPE) {
        setIsDesktopLauncher(Boolean(event.data.desktop));
        return;
      }

      if (event.data.type !== PARENT_PAGE_MESSAGE_TYPE) {
        return;
      }

      const parentHost = hostFromOrigin(event.origin);

      if (!parentHost || !isHostAllowed(parentHost, allowedDomains)) {
        return;
      }

      if (typeof event.data.url !== "string") {
        return;
      }

      try {
        const url = new URL(event.data.url);
        if (url.protocol !== "http:" && url.protocol !== "https:") {
          return;
        }
      } catch {
        return;
      }

      setParentPageUrl(botId, event.data.url);
      setParentPageUrlState(event.data.url);
    }

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [allowedDomains, botId, isTopLevel, searchParams]);

  function handleClose() {
    setIsOpen(false);
  }

  function handleOpen() {
    setIsOpen(true);
  }

  if (!sessionId) {
    return (
      <div className="flex h-full w-full items-end justify-end bg-transparent">
        <div
            className={cn(
              "animate-pulse rounded-full bg-zinc-200/80 size-14",
              isDesktopLauncher && "size-[4.5rem]",
            )}
          />
      </div>
    );
  }

  return (
    <WidgetThemeProvider settings={widgetSettings}>
      {!isOpen ? (
        <div className="relative flex h-full w-full items-end justify-end bg-transparent">
          <div
            className={cn(
              "relative shrink-0 size-14",
              isDesktopLauncher && "size-[4.5rem]",
            )}
          >
            <ChatLauncherHint
              text={widgetSettings.launcherHintText}
              backgroundColor={widgetSettings.launcherHintColor}
              onOpen={handleOpen}
              phase={hintPhase}
              large={isDesktopLauncher}
            />
            <ChatLauncher onOpen={handleOpen} large={isDesktopLauncher} />
          </div>
        </div>
      ) : (
        <ChatInterface
          botId={botId}
          sessionId={sessionId}
          business={business}
          widgetSettings={widgetSettings}
          parentPageUrl={parentPageUrl}
          onClose={handleClose}
        />
      )}
    </WidgetThemeProvider>
  );
}
