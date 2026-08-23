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
