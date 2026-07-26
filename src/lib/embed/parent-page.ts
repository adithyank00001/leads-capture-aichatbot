const PARENT_PAGE_PREFIX = "chatbot-parent-page:";

function getStorageKey(botId: string) {
  return `${PARENT_PAGE_PREFIX}${botId}`;
}

function isValidPageUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function setParentPageUrl(botId: string, url: string) {
  if (typeof window === "undefined" || !isValidPageUrl(url)) {
    return;
  }

  window.sessionStorage.setItem(getStorageKey(botId), url);
}

export function getParentPageUrl(botId: string) {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.sessionStorage.getItem(getStorageKey(botId));

  if (!stored || !isValidPageUrl(stored)) {
    return null;
  }

  return stored;
}

export function resolveParentPageUrl(botId: string, queryValue: string | null) {
  if (queryValue && isValidPageUrl(queryValue)) {
    setParentPageUrl(botId, queryValue);
    return queryValue;
  }

  return getParentPageUrl(botId);
}
