"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { ChatInterface } from "@/components/chatbot/chat-interface";
import { LeadForm } from "@/components/chatbot/lead-form";
import type { BusinessDisplay } from "@/lib/business/display";
import { getApiPath } from "@/lib/config";
import {
  resolveParentPageUrl,
  setParentPageUrl,
} from "@/lib/embed/parent-page";
import { isHostAllowed, normalizeDomain } from "@/lib/security/domain-shared";
import {
  getOrCreateSessionId,
  hasCompletedLead,
} from "@/lib/session/client";

const PARENT_PAGE_MESSAGE_TYPE = "chatbot-parent-page";

type ChatbotWidgetProps = {
  botId: string;
  business: BusinessDisplay;
};

function hostFromOrigin(origin: string) {
  try {
    return new URL(origin).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function ChatbotWidget({ botId, business }: ChatbotWidgetProps) {
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [parentPageUrl, setParentPageUrlState] = useState<string | null>(null);
  const [allowedDomains, setAllowedDomains] = useState<string[]>([]);

  useEffect(() => {
    const id = getOrCreateSessionId(botId);
    setSessionId(id);
    setShowChat(hasCompletedLead(botId, id));
  }, [botId]);

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
    const isTopLevel = window.self === window.top;
    const queryParentUrl = searchParams.get("parentUrl");

    if (isTopLevel) {
      setParentPageUrlState(
        resolveParentPageUrl(botId, queryParentUrl),
      );
      return;
    }

    // widget.js passes the customer page URL in the iframe query string.
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
  }, [allowedDomains, botId, searchParams]);

  if (!sessionId) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading chatbot…
      </div>
    );
  }

  if (!showChat) {
    return (
      <LeadForm
        botId={botId}
        sessionId={sessionId}
        business={business}
        parentPageUrl={parentPageUrl}
        onSuccess={() => setShowChat(true)}
      />
    );
  }

  return (
    <ChatInterface
      botId={botId}
      sessionId={sessionId}
      business={business}
      parentPageUrl={parentPageUrl}
    />
  );
}
