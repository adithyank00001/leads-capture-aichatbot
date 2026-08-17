export const FB_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || "1558542812314557";

declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
  }
}

export const pageview = () => {
  window.fbq?.("track", "PageView");
};

export const track = (
  name: string,
  options: Record<string, unknown> = {},
) => {
  window.fbq?.("track", name, options);
};
