import { getApiPath } from "@/lib/config";
import { AI_REQUEST_TIMEOUT_MS } from "@/lib/demo/constants";

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

export type DemoHistoryItem = {
  role: "user" | "assistant";
  content: string;
};

export async function sendDemoChatMessage(input: {
  sessionId: string;
  message: string;
  history: DemoHistoryItem[];
  signal?: AbortSignal;
}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, AI_REQUEST_TIMEOUT_MS);

  const abortFromParent = () => {
    controller.abort();
  };

  if (input.signal) {
    if (input.signal.aborted) {
      clearTimeout(timeoutId);
      throw new Error("Something took longer than expected.");
    }

    input.signal.addEventListener("abort", abortFromParent, { once: true });
  }

  try {
    const response = await fetch(getApiPath("demo-chat"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId: input.sessionId,
        message: input.message,
        history: input.history,
      }),
      signal: controller.signal,
    });

    const payload = (await response.json()) as
      | ApiSuccess<{ answer: string; aiConnected: boolean }>
      | ApiFailure;

    if (!response.ok || !payload.ok) {
      const message =
        !payload.ok && payload.error?.message
          ? payload.error.message
          : "Something took longer than expected.";

      throw new Error(message);
    }

    return payload.data;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Something took longer than expected.");
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Something took longer than expected.");
  } finally {
    clearTimeout(timeoutId);

    if (input.signal) {
      input.signal.removeEventListener("abort", abortFromParent);
    }
  }
}
