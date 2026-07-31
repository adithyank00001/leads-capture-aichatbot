(function () {
  "use strict";

  var WIDGET_ROOT_ID = "chatbot-mvp-root";
  var GLOBAL_NAME = "ChatbotMvp";
  var RESIZE_MESSAGE_TYPE = "chatbot-widget-resize";
  var LAUNCHER_SIZE = 56;

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

  function applyLauncherStyles(container, iframe) {
    container.style.width = LAUNCHER_SIZE + "px";
    container.style.height = LAUNCHER_SIZE + "px";
    container.style.maxWidth = LAUNCHER_SIZE + "px";
    container.style.maxHeight = LAUNCHER_SIZE + "px";
    iframe.style.borderRadius = "9999px";
    iframe.style.boxShadow = "none";
    iframe.style.background = "transparent";
  }

  function applyPanelStyles(container, iframe) {
    container.style.width = "min(100vw - 32px, 380px)";
    container.style.height = "min(100vh - 32px, 620px)";
    container.style.maxWidth = "380px";
    container.style.maxHeight = "620px";
    iframe.style.borderRadius = "16px";
    iframe.style.boxShadow = "0 12px 40px rgba(0, 0, 0, 0.18)";
    iframe.style.background = "#ffffff";
  }

  function createWidget(script) {
    var botId = resolveBotId(script);
    var baseUrl = getBaseUrl(script);

    if (!botId || !baseUrl) {
      return null;
    }

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
    iframe.setAttribute("loading", "lazy");
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
      if (event.origin !== baseUrl) {
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
        version: "0.1.0",
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
