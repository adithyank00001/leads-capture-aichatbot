(function () {
  "use strict";

  var WIDGET_ROOT_ID = "chatbot-mvp-root";
  var GLOBAL_NAME = "ChatbotMvp";
  var RESIZE_MESSAGE_TYPE = "chatbot-widget-resize";
  var LAUNCHER_HINT_WIDTH = 280;
  var LAUNCHER_HINT_HEIGHT = 140;

  if (window[GLOBAL_NAME] && window[GLOBAL_NAME].loaded) {
    return;
  }

  function getCurrentScript() {
    if (document.currentScript) {
      return document.currentScript;
    }

    var scripts = document.getElementsByTagName("script");

    for (var index = scripts.length - 1; index >= 0; index -= 1) {
      var candidate = scripts[index];

      if (candidate.src && candidate.src.indexOf("widget.js") !== -1) {
        return candidate;
      }
    }

    return null;
  }

  function getBaseUrl(script) {
    try {
      return new URL(script.src).origin;
    } catch (error) {
      return "";
    }
  }

  function resolveBotId(script) {
    var botId = script.getAttribute("data-bot-id");

    if (botId && botId.trim()) {
      return botId.trim();
    }

    console.error(
      "[Chatbot] Missing data-bot-id on the embed script. Add data-bot-id=\"YOUR_BOT_ID\" to the script tag.",
    );
    return null;
  }

  function setBox(element, styles) {
    var keys = Object.keys(styles);
    for (var i = 0; i < keys.length; i++) {
      element.style.setProperty(keys[i], styles[keys[i]], "important");
    }
  }

  // Closed widget: always a transparent box big enough for the button + hint bubble.
  // Do not use a tiny circular iframe — it clips the page and looks broken.
  function applyLauncherStyles(container, iframe) {
    setBox(container, {
      width: LAUNCHER_HINT_WIDTH + "px",
      height: LAUNCHER_HINT_HEIGHT + "px",
      "max-width": "min(100vw - 32px, " + LAUNCHER_HINT_WIDTH + "px)",
      "max-height": LAUNCHER_HINT_HEIGHT + "px",
      "min-width": "180px",
      "min-height": LAUNCHER_HINT_HEIGHT + "px",
      overflow: "visible",
    });
    setBox(iframe, {
      width: "100%",
      height: "100%",
      "border-radius": "0",
      "box-shadow": "none",
      background: "transparent",
    });
  }

  function applyLauncherHintStyles(container, iframe) {
    applyLauncherStyles(container, iframe);
  }

  function applyPanelStyles(container, iframe) {
    setBox(container, {
      width: "min(100vw - 32px, 380px)",
      height: "min(100vh - 32px, 620px)",
      "max-width": "380px",
      "max-height": "620px",
      "min-width": "280px",
      "min-height": "420px",
      overflow: "visible",
    });
    setBox(iframe, {
      width: "100%",
      height: "100%",
      "min-width": "100%",
      "min-height": "100%",
      "border-radius": "16px",
      "box-shadow": "0 12px 40px rgba(0, 0, 0, 0.18)",
      background: "#ffffff",
    });
  }

  function sendHeartbeat(baseUrl, botId) {
    try {
      var checkId = "";
      try {
        checkId = new URLSearchParams(window.location.search).get("leady_check") || "";
      } catch (readError) {
        checkId = "";
      }

      var payload = {
        botId: botId,
        pageUrl: window.location.href,
      };

      if (checkId) {
        payload.checkId = checkId;
      }

      fetch(baseUrl + "/api/v1/widget-heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
        mode: "cors",
      }).catch(function () {});
    } catch (heartbeatError) {}
  }

  function createWidget(script) {
    var botId = resolveBotId(script);
    var baseUrl = getBaseUrl(script);

    if (!botId || !baseUrl) {
      return null;
    }

    sendHeartbeat(baseUrl, botId);

    if (document.getElementById(WIDGET_ROOT_ID)) {
      return null;
    }

    var container = document.createElement("div");
    container.id = WIDGET_ROOT_ID;
    container.setAttribute("data-chatbot-mvp", "true");
    container.style.cssText = [
      "position: fixed",
      "right: 16px",
      "bottom: 16px",
      "z-index: 2147483000",
      "pointer-events: auto",
    ].join(";");

    var iframe = document.createElement("iframe");
    iframe.id = WIDGET_ROOT_ID + "-iframe";
    iframe.title = "Website chatbot";
    iframe.src =
      baseUrl +
      "/embed/" +
      encodeURIComponent(botId) +
      "?parentUrl=" +
      encodeURIComponent(window.location.href);
    iframe.style.cssText = [
      "width: 100%",
      "height: 100%",
      "border: 0",
    ].join(";");

    container.appendChild(iframe);
    document.body.appendChild(container);

    applyLauncherStyles(container, iframe);

    iframe.addEventListener("load", function () {
      if (!iframe.contentWindow) {
        return;
      }

      iframe.contentWindow.postMessage(
        {
          type: "chatbot-parent-page",
          url: window.location.href,
        },
        baseUrl,
      );
    });

    window.addEventListener("message", function (event) {
      if (iframe.contentWindow && event.source !== iframe.contentWindow) {
        return;
      }

      if (
        !event.data ||
        typeof event.data !== "object" ||
        event.data.type !== RESIZE_MESSAGE_TYPE
      ) {
        return;
      }

      if (event.data.mode === "launcher") {
        applyLauncherStyles(container, iframe);
        return;
      }

      if (event.data.mode === "launcher-hint") {
        applyLauncherHintStyles(container, iframe);
        return;
      }

      if (event.data.mode === "panel") {
        applyPanelStyles(container, iframe);
      }
    });

    return {
      botId: botId,
      baseUrl: baseUrl,
      container: container,
      iframe: iframe,
      open: function () {
        applyPanelStyles(container, iframe);
        if (iframe.contentWindow) {
          iframe.contentWindow.postMessage(
            { type: RESIZE_MESSAGE_TYPE, mode: "panel" },
            baseUrl,
          );
        }
      },
      close: function () {
        applyLauncherStyles(container, iframe);
        if (iframe.contentWindow) {
          iframe.contentWindow.postMessage(
            { type: RESIZE_MESSAGE_TYPE, mode: "launcher" },
            baseUrl,
          );
        }
      },
    };
  }

  function init() {
    try {
      var script = getCurrentScript();

      if (!script) {
        return;
      }

      var widget = createWidget(script);

      if (!widget) {
        return;
      }

      window[GLOBAL_NAME] = {
        version: "0.1.2",
        loaded: true,
        status: "ready",
        botId: widget.botId,
        open: widget.open,
        close: widget.close,
      };
    } catch (error) {
      if (window[GLOBAL_NAME]) {
        window[GLOBAL_NAME].status = "error";
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
