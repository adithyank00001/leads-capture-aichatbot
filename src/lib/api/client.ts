import { getApiPath } from "@/lib/config";

type ApiSuccess<T> = {
  ok: true;
  data: T;
};

type ApiFailure = {
  ok: false;
  error: {
    code: string;
    message: string;
  };
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

async function postJson<T>(path: string, body: Record<string, unknown>) {
  const response = await fetch(getApiPath(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as ApiSuccess<T> | ApiFailure;

  if (!response.ok || !payload.ok) {
    const message =
      !payload.ok && payload.error?.message
        ? payload.error.message
        : "Something went wrong. Please try again.";

    throw new Error(message);
  }

  return payload.data;
}

export async function submitLead(input: {
  botId: string;
  sessionId: string;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  customFields?: Record<string, string>;
  pageUrl?: string;
}) {
  return postJson<{
    lead: {
      id: string;
      name: string | null;
      phone: string | null;
      email: string | null;
      custom_fields: Record<string, string>;
      session_id: string;
    };
    created: boolean;
  }>("leads", {
    botId: input.botId,
    sessionId: input.sessionId,
    name: input.name ?? null,
    phone: input.phone ?? null,
    email: input.email ?? null,
    customFields: input.customFields ?? {},
    pageUrl: input.pageUrl,
  });
}

export async function sendChatMessage(input: {
  botId: string;
  sessionId: string;
  message: string;
  pageUrl?: string;
}) {
  return postJson<{
    answer: string;
    messages: ChatMessage[];
    aiConnected: boolean;
  }>("chat", {
    botId: input.botId,
    sessionId: input.sessionId,
    message: input.message,
    pageUrl: input.pageUrl,
  });
}

export async function fetchMessages(input: {
  botId: string;
  sessionId: string;
}) {
  const params = new URLSearchParams({
    botId: input.botId,
    sessionId: input.sessionId,
  });

  const response = await fetch(`${getApiPath("messages")}?${params.toString()}`, {
    method: "GET",
    cache: "no-store",
  });

  const payload = (await response.json()) as
    | ApiSuccess<{ messages: ChatMessage[] }>
    | ApiFailure;

  if (!response.ok || !payload.ok) {
    const message =
      !payload.ok && payload.error?.message
        ? payload.error.message
        : "Could not load conversation history.";

    throw new Error(message);
  }

  return payload.data.messages;
}
