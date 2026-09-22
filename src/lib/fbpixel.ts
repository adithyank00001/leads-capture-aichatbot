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
 * Advanced Matching — pass buyer email/phone to the Pixel (Meta hashes them).
 */
export function setPixelUserData(data: { em?: string; ph?: string }) {
  const email = data.em?.trim().toLowerCase();
  const phoneDigits = data.ph?.replace(/\D/g, "") ?? "";
  const payload: Record<string, string> = {};

  if (email && email.includes("@")) {
    payload.em = email;
  }
  if (phoneDigits.length >= 10) {
    // Pixel accepts phone; Meta hashes client-side. Prefer country code when possible.
    let ph = phoneDigits.replace(/^00+/, "").replace(/^0+/, "");
    if (/^[6-9]\d{9}$/.test(ph)) {
      ph = `91${ph}`;
    }
    if (ph.length >= 10 && ph.length <= 15) {
      payload.ph = ph;
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
