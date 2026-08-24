export const WIDGET_RESIZE_MESSAGE_TYPE = "chatbot-widget-resize";
export const PARENT_VIEWPORT_MESSAGE_TYPE = "chatbot-parent-viewport";

export type WidgetResizeMode = "launcher" | "launcher-hint" | "panel";

export function postWidgetResize(mode: WidgetResizeMode) {
  if (typeof window === "undefined" || window.self === window.top) {
    return;
  }

  function send() {
    window.parent.postMessage(
      {
        type: WIDGET_RESIZE_MESSAGE_TYPE,
        mode,
      },
      "*",
    );
  }

  send();
  window.requestAnimationFrame(send);
}
