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

let memorySessionId: string | null = null;
let memoryLeadComplete = false;
const memoryMessages = new Map<string, DemoChatMessage[]>();

function createSessionId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `demo-session-${Date.now()}`;
}

function readSessionStorage(key: string) {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSessionStorage(key: string, value: string) {
  try {
    window.sessionStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function getLeadStorageKey(sessionId: string) {
  return `${DEMO_LEAD_PREFIX}${sessionId}`;
}

function getMessagesStorageKey(sessionId: string) {
  return `${DEMO_MESSAGES_PREFIX}${sessionId}`;
}

export function getOrCreateDemoSessionId() {
  if (typeof window === "undefined") {
    return "demo-static";
  }

  const existing = readSessionStorage(DEMO_SESSION_KEY);

  if (existing) {
    memorySessionId = existing;
    return existing;
  }

  const sessionId = memorySessionId ?? createSessionId();
  memorySessionId = sessionId;

  writeSessionStorage(DEMO_SESSION_KEY, sessionId);

  return sessionId;
}

export function hasCompletedDemoLead(sessionId: string) {
  if (typeof window === "undefined") {
    return false;
  }

  if (readSessionStorage(getLeadStorageKey(sessionId)) === "true") {
    return true;
  }

  return memoryLeadComplete;
}

export function markDemoLeadCompleted(sessionId: string) {
  if (typeof window === "undefined") {
    return;
  }

  memoryLeadComplete = true;
  writeSessionStorage(getLeadStorageKey(sessionId), "true");
}

export function loadDemoMessages(sessionId: string): DemoChatMessage[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = readSessionStorage(getMessagesStorageKey(sessionId));

  if (!raw) {
    return memoryMessages.get(sessionId) ?? [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return memoryMessages.get(sessionId) ?? [];
    }

    const messages = parsed.filter(
      (item): item is DemoChatMessage =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as DemoChatMessage).id === "string" &&
        ((item as DemoChatMessage).role === "user" ||
          (item as DemoChatMessage).role === "assistant") &&
        typeof (item as DemoChatMessage).content === "string" &&
        typeof (item as DemoChatMessage).created_at === "string",
    );

    memoryMessages.set(sessionId, messages);
    return messages;
  } catch {
    return memoryMessages.get(sessionId) ?? [];
  }
}

export function saveDemoMessages(
  sessionId: string,
  messages: DemoChatMessage[],
) {
  if (typeof window === "undefined") {
    return;
  }

  memoryMessages.set(sessionId, messages);
  writeSessionStorage(
    getMessagesStorageKey(sessionId),
    JSON.stringify(messages),
  );
}

export function createDemoMessageId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `demo-msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
