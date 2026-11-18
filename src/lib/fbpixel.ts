export const FB_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || "1558542812314557";

declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
    __LEADCX_META__?: {
      initialPageViewKey?: string;
      initialPageViewEventId?: string;
      pixelBootstrapped?: boolean;
      pixelPageViewQueued?: boolean;
      capiPageViewSent?: boolean;
      testEventCode?: string;
    };
  }
}

export type TrackEventOptions = {
  eventID?: string;
  test_event_code?: string;
};

export function getBrowserTestEventCode(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const fromBoot = window.__LEADCX_META__?.testEventCode?.trim();
    if (fromBoot && /^TEST\d+$/i.test(fromBoot)) {
      return fromBoot;
    }
    const params = new URLSearchParams(window.location.search);
    const code = params.get("test_event_code") || params.get("testCode");
    if (code && /^TEST\d+$/i.test(code.trim())) {
      return code.trim();
    }
    const envCode = process.env.NEXT_PUBLIC_META_TEST_EVENT_CODE?.trim();
    if (envCode && /^TEST\d+$/i.test(envCode)) {
      return envCode;
    }
  } catch {
    // ignore
  }
  return undefined;
}

export const pageview = (eventID?: string) => {
  const testCode = getBrowserTestEventCode();
  const options: Record<string, unknown> = {};
  if (eventID) options.eventID = eventID;
  if (testCode) options.test_event_code = testCode;

  if (Object.keys(options).length > 0) {
    window.fbq?.("track", "PageView", {}, options);
    return;
  }

  window.fbq?.("track", "PageView");
};

export const track = (
  name: string,
  options: Record<string, unknown> = {},
  eventOptions: TrackEventOptions = {},
) => {
  const testCode = eventOptions.test_event_code || getBrowserTestEventCode();
  const extra: Record<string, unknown> = {};
  if (eventOptions.eventID) {
    extra.eventID = eventOptions.eventID;
  }
  if (testCode) {
    extra.test_event_code = testCode;
  }

  if (Object.keys(extra).length > 0) {
    window.fbq?.("track", name, options, extra);
    return;
  }

  window.fbq?.("track", name, options);
};

/**
 * Advanced Matching — pass buyer details to the Pixel (Meta hashes them).
 * Only send fields we actually have.
 */
export function setPixelUserData(data: {
  em?: string;
  ph?: string;
  fn?: string;
  ln?: string;
  country?: string;
  external_id?: string | string[];
}) {
  const payload: Record<string, string | string[]> = {};

  const email = data.em?.trim().toLowerCase();
  if (email && email.includes("@")) {
    payload.em = email;
  }

  const phoneDigits = data.ph?.replace(/\D/g, "") ?? "";
  if (phoneDigits.length >= 10) {
    let ph = phoneDigits.replace(/^00+/, "").replace(/^0+/, "");
    if (/^[6-9]\d{9}$/.test(ph)) {
      ph = `91${ph}`;
    }
    if (ph.length >= 10 && ph.length <= 15) {
      payload.ph = ph;
    }
  }

  const fn = data.fn?.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
  if (fn) {
    payload.fn = fn;
  }

  const ln = data.ln?.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
  if (ln) {
    payload.ln = ln;
  }

  const country = data.country?.trim().toLowerCase();
  if (country && /^[a-z]{2}$/.test(country)) {
    payload.country = country;
  }

  if (typeof data.external_id === "string" && data.external_id.trim()) {
    payload.external_id = data.external_id.trim();
  } else if (Array.isArray(data.external_id)) {
    const ids = data.external_id.map((id) => id.trim()).filter(Boolean);
    if (ids.length === 1) {
      payload.external_id = ids[0];
    } else if (ids.length > 1) {
      payload.external_id = ids;
    }
  }

  if (Object.keys(payload).length === 0) {
    return;
  }

  try {
    window.fbq?.("set", "userData", payload);
  } catch {
    // Pixel must never break checkout.
  }
}
