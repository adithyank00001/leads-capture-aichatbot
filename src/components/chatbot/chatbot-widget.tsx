"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { ChatInterface } from "@/components/chatbot/chat-interface";
import { ChatLauncher } from "@/components/chatbot/chat-launcher";
import { WidgetThemeProvider } from "@/components/chatbot/widget-theme-provider";
import type { BusinessDisplay } from "@/lib/business/display";
import { getApiPath } from "@/lib/config";
import {
  resolveParentPageUrl,
  setParentPageUrl,
} from "@/lib/embed/parent-page";
import { postWidgetResize } from "@/lib/embed/widget-messages";
import { isHostAllowed, normalizeDomain } from "@/lib/security/domain-shared";
import { getOrCreateSessionId } from "@/lib/session/client";
import type { WidgetSettings } from "@/lib/widget/types";

const PARENT_PAGE_MESSAGE_TYPE = "chatbot-parent-page";

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
    postWidgetResize(isOpen ? "panel" : "launcher");
  }, [isOpen]);

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
      if (
        !event.data ||
        typeof event.data !== "object" ||
        event.data.type !== PARENT_PAGE_MESSAGE_TYPE
      ) {
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
      <div className="flex h-full items-center justify-center text-sm text-zinc-500">
        Loading chatbot…
      </div>
    );
  }

  return (
    <WidgetThemeProvider settings={widgetSettings}>
      {!isOpen ? (
        <ChatLauncher onOpen={handleOpen} />
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
