export const FB_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || "1558542812314557";

declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
  }
}

export const pageview = (eventID?: string) => {
  if (eventID) {
    window.fbq?.("track", "PageView", {}, { eventID });
    return;
  }

  window.fbq?.("track", "PageView");
};

export type TrackEventOptions = {
  eventID?: string;
};

export const track = (
  name: string,
  options: Record<string, unknown> = {},
  eventOptions: TrackEventOptions = {},
) => {
  if (eventOptions.eventID) {
    window.fbq?.("track", name, options, { eventID: eventOptions.eventID });
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
