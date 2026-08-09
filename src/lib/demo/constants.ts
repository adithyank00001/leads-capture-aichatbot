export const AI_HISTORY_LIMIT = 10;
export const AI_REQUEST_TIMEOUT_MS = 30_000;
export const AI_THINKING_PHASE_MS = 8_000;

export const DEMO_SESSION_KEY = "chatbot-demo:session:landing";
export const DEMO_LEAD_PREFIX = "chatbot-demo:lead-complete:landing:";
export const DEMO_MESSAGES_PREFIX = "chatbot-demo:messages:landing:";

export const DEMO_RATE_LIMIT_SESSION_PER_MIN = 10;
export const DEMO_RATE_LIMIT_IP_PER_MIN = 40;

export const DEMO_MAX_HISTORY_ITEMS = 20;

export const DEMO_LEAD = {
  name: "Demo User",
  email: "demo@example.com",
  phone: "0000000000",
} as const;

export const DEMO_WAITING_MESSAGES = {
  thinking: "Thinking…",
  stillWorking: "Still working on it…",
  timeout: "Something took longer than expected.",
} as const;
