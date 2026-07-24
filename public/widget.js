(function () {
  "use strict";

  var WIDGET_ROOT_ID = "chatbot-mvp-root";
  var GLOBAL_NAME = "ChatbotMvp";

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

  function createWidget(script) {
    var botId = script.getAttribute("data-bot-id") || "test-business-1";
    var baseUrl = getBaseUrl(script);

    if (!baseUrl) {
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
      "width: min(100vw - 32px, 380px)",
      "height: min(100vh - 32px, 620px)",
      "max-width: 380px",
      "max-height: 620px",
      "z-index: 2147483000",
      "pointer-events: auto",
    ].join(";");

    var iframe = document.createElement("iframe");
    iframe.id = WIDGET_ROOT_ID + "-iframe";
    iframe.title = "Website chatbot";
    iframe.src = baseUrl + "/embed/" + encodeURIComponent(botId);
    iframe.setAttribute("loading", "lazy");
    iframe.style.cssText = [
      "width: 100%",
      "height: 100%",
      "border: 0",
      "border-radius: 16px",
      "box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18)",
      "background: #ffffff",
    ].join(";");

    container.appendChild(iframe);
    document.body.appendChild(container);

    return {
      botId: botId,
      baseUrl: baseUrl,
      container: container,
      iframe: iframe,
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
        open: function () {
          widget.container.style.display = "block";
        },
        close: function () {
          widget.container.style.display = "none";
        },
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
