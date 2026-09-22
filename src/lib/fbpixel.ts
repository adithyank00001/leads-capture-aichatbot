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
 * Advanced Matching — pass buyer email to the Pixel (Meta hashes it).
 * Call when the store checkout form has a valid email.
 */
export function setPixelUserData(data: { em?: string }) {
  const email = data.em?.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return;
  }
  try {
    window.fbq?.("set", "userData", { em: email });
  } catch {
    // Pixel must never break checkout.
  }
}
