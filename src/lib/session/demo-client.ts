import {
  DEMO_LEAD_PREFIX,
  DEMO_MESSAGES_PREFIX,
  DEMO_SESSION_KEY,
} from "@/lib/demo/constants";

export type DemoChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

function getLeadStorageKey(sessionId: string) {
  return `${DEMO_LEAD_PREFIX}${sessionId}`;
}

function getMessagesStorageKey(sessionId: string) {
  return `${DEMO_MESSAGES_PREFIX}${sessionId}`;
}

export function getOrCreateDemoSessionId() {
  if (typeof window === "undefined") {
    return "";
  }

  const existing = window.sessionStorage.getItem(DEMO_SESSION_KEY);

  if (existing) {
    return existing;
  }

  const sessionId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `demo-session-${Date.now()}`;

  window.sessionStorage.setItem(DEMO_SESSION_KEY, sessionId);
  return sessionId;
}

export function hasCompletedDemoLead(sessionId: string) {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.sessionStorage.getItem(getLeadStorageKey(sessionId)) === "true"
  );
}

export function markDemoLeadCompleted(sessionId: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(getLeadStorageKey(sessionId), "true");
}

export function loadDemoMessages(sessionId: string): DemoChatMessage[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.sessionStorage.getItem(getMessagesStorageKey(sessionId));

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item): item is DemoChatMessage =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as DemoChatMessage).id === "string" &&
        ((item as DemoChatMessage).role === "user" ||
          (item as DemoChatMessage).role === "assistant") &&
        typeof (item as DemoChatMessage).content === "string" &&
        typeof (item as DemoChatMessage).created_at === "string",
    );
  } catch {
    return [];
  }
}

export function saveDemoMessages(
  sessionId: string,
  messages: DemoChatMessage[],
) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(
    getMessagesStorageKey(sessionId),
    JSON.stringify(messages),
  );
}

export function createDemoMessageId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `demo-msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
