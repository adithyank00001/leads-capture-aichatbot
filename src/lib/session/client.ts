const SESSION_PREFIX = "chatbot-mvp:session:";
const LEAD_PREFIX = "chatbot-mvp:lead-complete:";

function getSessionStorageKey(botId: string) {
  return `${SESSION_PREFIX}${botId}`;
}

function getLeadStorageKey(botId: string, sessionId: string) {
  return `${LEAD_PREFIX}${botId}:${sessionId}`;
}

export function getOrCreateSessionId(botId: string) {
  if (typeof window === "undefined") {
    return "";
  }

  const key = getSessionStorageKey(botId);
  const existing = window.sessionStorage.getItem(key);

  if (existing) {
    return existing;
  }

  const sessionId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `session-${Date.now()}`;

  window.sessionStorage.setItem(key, sessionId);
  return sessionId;
}

export function hasCompletedLead(botId: string, sessionId: string) {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.sessionStorage.getItem(getLeadStorageKey(botId, sessionId)) === "true"
  );
}

export function markLeadCompleted(botId: string, sessionId: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(getLeadStorageKey(botId, sessionId), "true");
}
