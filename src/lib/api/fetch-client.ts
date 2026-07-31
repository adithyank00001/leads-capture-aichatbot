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
      ...fetchOptions,
      signal: controller.signal,
    });
    const body = (await response.json()) as T;

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
