const DEFAULT_TIMEOUT_MS = 20000;

type FetchJsonResult<T> = {
  response: Response;
  body: T;
};

export async function fetchJsonWithTimeout<T>(
  url: string,
  options: RequestInit & { timeoutMs?: number } = {},
): Promise<FetchJsonResult<T>> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...fetchOptions } = options;
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      credentials: "same-origin",
      ...fetchOptions,
      signal: controller.signal,
    });

    const contentType = response.headers.get("content-type") ?? "";
    const raw = await response.text();

    if (!contentType.includes("application/json")) {
      const looksHtml = raw.trimStart().startsWith("<!DOCTYPE") || raw.trimStart().startsWith("<html");
      throw new Error(
        looksHtml
          ? "The server took too long or returned a web page instead of data. Please try again in a moment. If it keeps happening, refresh and log in again."
          : "Server returned an unexpected response. Please refresh and try again.",
      );
    }

    let body: T;
    try {
      body = JSON.parse(raw) as T;
    } catch {
      throw new Error(
        "Server returned invalid JSON. Please refresh and try again.",
      );
    }

    return { response, body };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Request timed out. Please refresh and try again.");
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}
