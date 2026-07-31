export const WIDGET_RESIZE_MESSAGE_TYPE = "chatbot-widget-resize";

export type WidgetResizeMode = "launcher" | "panel";

export function postWidgetResize(mode: WidgetResizeMode) {
  if (typeof window === "undefined" || window.self === window.top) {
    return;
  }

  window.parent.postMessage(
    {
      type: WIDGET_RESIZE_MESSAGE_TYPE,
      mode,
    },
    "*",
  );
}
