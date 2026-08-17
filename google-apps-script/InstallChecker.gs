/**
 * Widget install checker — one website per invocation.
 *
 * Deploy as separate web app → GAS_MONITOR_WEB_APP_URL
 *
 * Script properties:
 *   GAS_MONITOR_HMAC_SECRET
 *   CLOUDFLARE_ACCOUNT_ID
 *   CLOUDFLARE_API_TOKEN
 *   LOG_SHEET_ID (Google Sheet for automatic/deployed checks only)
 *   LEADY_APP_URL (public Leady website, e.g. https://your-app.vercel.app)
 *               Used because Google Apps Script often cannot reach api.cloudflare.com.
 *
 * Manual test: set MANUAL_TEST_WEBSITE, then Run → runManualInstallCheck
 * Manual logs go to Executions only, not the sheet.
 */

var MANUAL_TEST_WEBSITE = "https://example.com";

var HMAC_TTL_SECONDS = 15 * 60;
var BROWSER_TIMEOUT_MS = 45000;
var LOG_SHEET_HEADERS = [
  "Timestamp",
  "Website",
  "Bot ID",
  "Cloudflare opened",
  "Widget found",
  "Seconds",
  "Error",
];

function getConfig_() {
  var props = PropertiesService.getScriptProperties();
  return {
    GAS_MONITOR_HMAC_SECRET: props.getProperty("GAS_MONITOR_HMAC_SECRET") || "",
    CLOUDFLARE_ACCOUNT_ID: props.getProperty("CLOUDFLARE_ACCOUNT_ID") || "",
    CLOUDFLARE_API_TOKEN: props.getProperty("CLOUDFLARE_API_TOKEN") || "",
    LOG_SHEET_ID: props.getProperty("LOG_SHEET_ID") || "",
    LOG_SHEET_TAB: props.getProperty("LOG_SHEET_TAB") || "InstallChecks",
    LEADY_APP_URL: (props.getProperty("LEADY_APP_URL") || "").replace(/\/$/, ""),
  };
}

function jsonResponse_(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function hmacHex_(canonical, secret) {
  return Utilities.computeHmacSha256Signature(canonical, secret)
    .map(function (byte) {
      var hex = (byte < 0 ? byte + 256 : byte).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    })
    .join("");
}

function canonicalCheck_(body) {
  return JSON.stringify({
    action: body.action,
    checkId: body.checkId,
    botId: body.botId,
    websiteUrl: body.websiteUrl,
    completeUrl: body.completeUrl,
    exp: body.exp,
  });
}

function canonicalBrowse_(body) {
  return JSON.stringify({
    action: body.action,
    websiteUrl: body.websiteUrl,
    exp: body.exp,
  });
}

function canonicalComplete_(body) {
  return JSON.stringify({
    action: body.action,
    checkId: body.checkId,
    botId: body.botId,
    pageOk: body.pageOk,
    errorMessage: body.errorMessage == null ? null : body.errorMessage,
    exp: body.exp,
  });
}

function verifyCheck_(body) {
  var config = getConfig_();
  if (!config.GAS_MONITOR_HMAC_SECRET || !body || !body.sig || !body.exp) {
    return false;
  }
  if (body.action !== "monitor_check") {
    return false;
  }
  if (Number(body.exp) < Math.floor(Date.now() / 1000)) {
    return false;
  }
  return (
    hmacHex_(canonicalCheck_(body), config.GAS_MONITOR_HMAC_SECRET) === body.sig
  );
}

function signBrowse_(websiteUrl) {
  var config = getConfig_();
  var payload = {
    action: "monitor_browse",
    websiteUrl: websiteUrl,
    exp: Math.floor(Date.now() / 1000) + HMAC_TTL_SECONDS,
  };
  payload.sig = hmacHex_(canonicalBrowse_(payload), config.GAS_MONITOR_HMAC_SECRET);
  return payload;
}

function signComplete_(payload) {
  var config = getConfig_();
  payload.exp = Math.floor(Date.now() / 1000) + HMAC_TTL_SECONDS;
  payload.sig = hmacHex_(
    canonicalComplete_(payload),
    config.GAS_MONITOR_HMAC_SECRET,
  );
  return payload;
}

function withCheckQuery_(websiteUrl, checkId) {
  var url = String(websiteUrl || "");
  var separator = url.indexOf("?") === -1 ? "?" : "&";
  return url + separator + "leady_check=" + encodeURIComponent(checkId);
}

function secondsBetween_(startedAt) {
  return Math.round((Date.now() - startedAt) / 100) / 10;
}

function extractHtmlFromCloudflare_(text) {
  try {
    var parsed = JSON.parse(text);
    if (typeof parsed === "string") {
      return parsed;
    }
    if (parsed && typeof parsed.result === "string") {
      return parsed.result;
    }
    if (parsed && parsed.result && typeof parsed.result.html === "string") {
      return parsed.result.html;
    }
    if (parsed && typeof parsed.content === "string") {
      return parsed.content;
    }
  } catch (parseErr) {}
  return String(text || "");
}

function detectWidgetInHtml_(html) {
  var page = String(html || "").toLowerCase();
  if (!page) {
    return false;
  }
  return (
    page.indexOf("widget.js") !== -1 ||
    page.indexOf("chatbot-mvp-root") !== -1 ||
    page.indexOf("data-chatbot-mvp") !== -1 ||
    page.indexOf("chatbotmvp") !== -1 ||
    page.indexOf("data-bot-id") !== -1
  );
}

function logManual_(message) {
  Logger.log(message);
}

function logAutomaticToSheet_(
  websiteUrl,
  botId,
  pageOk,
  widgetFound,
  seconds,
  errorMessage,
) {
  try {
    var config = getConfig_();
    if (!config.LOG_SHEET_ID) {
      Logger.log("Automatic check finished but LOG_SHEET_ID is not set.");
      return;
    }
    var ss = SpreadsheetApp.openById(config.LOG_SHEET_ID);
    var sheet =
      ss.getSheetByName(config.LOG_SHEET_TAB) ||
      ss.insertSheet(config.LOG_SHEET_TAB);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(LOG_SHEET_HEADERS);
      sheet.setFrozenRows(1);
    } else {
      var header = String(sheet.getRange(1, 1, 1, 7).getValues()[0][4] || "");
      if (header !== "Widget found") {
        sheet.getRange(1, 1, 1, LOG_SHEET_HEADERS.length).setValues([LOG_SHEET_HEADERS]);
        sheet.setFrozenRows(1);
      }
    }
    sheet.appendRow([
      Utilities.formatDate(
        new Date(),
        Session.getScriptTimeZone(),
        "yyyy-MM-dd HH:mm:ss",
      ),
      websiteUrl || "",
      botId || "",
      pageOk ? "yes" : "no",
      widgetFound ? "yes" : "no",
      seconds,
      errorMessage
        ? String(errorMessage).replace(/\s+/g, " ").slice(0, 300)
        : "",
    ]);
  } catch (logErr) {
    Logger.log("Sheet log failed: " + logErr);
  }
}

function failedBrowse_(startedAt, errorMessage) {
  return {
    pageOk: false,
    widgetFound: false,
    errorMessage: errorMessage,
    seconds: secondsBetween_(startedAt),
  };
}

function resultFromHtml_(startedAt, pageOk, html, errorMessage) {
  return {
    pageOk: pageOk,
    widgetFound: pageOk ? detectWidgetInHtml_(html) : false,
    errorMessage: errorMessage,
    seconds: secondsBetween_(startedAt),
  };
}

function browseViaLeady_(targetUrl, startedAt) {
  var config = getConfig_();
  if (!config.LEADY_APP_URL || !config.GAS_MONITOR_HMAC_SECRET) {
    return null;
  }

  var response = UrlFetchApp.fetch(
    config.LEADY_APP_URL + "/api/internal/widget-monitor/browse",
    {
      method: "post",
      muteHttpExceptions: true,
      contentType: "application/json",
      payload: JSON.stringify(signBrowse_(targetUrl)),
    },
  );
  var status = response.getResponseCode();
  var text = String(response.getContentText() || "");

  if (status < 200 || status >= 300) {
    return failedBrowse_(
      startedAt,
      "Leady browse HTTP " + status + ": " + text.slice(0, 300),
    );
  }

  var parsed = JSON.parse(text);
  var data = parsed && parsed.data ? parsed.data : parsed;
  return resultFromHtml_(
    startedAt,
    Boolean(data && data.pageOk),
    data && data.html ? data.html : "",
    data && data.errorMessage ? data.errorMessage : null,
  );
}

function browseViaCloudflareDirect_(targetUrl, startedAt) {
  var config = getConfig_();
  if (!config.CLOUDFLARE_ACCOUNT_ID || !config.CLOUDFLARE_API_TOKEN) {
    return failedBrowse_(
      startedAt,
      "Cloudflare Browser Rendering is not configured.",
    );
  }

  var endpoint =
    "https://api.cloudflare.com/client/v4/accounts/" +
    encodeURIComponent(config.CLOUDFLARE_ACCOUNT_ID) +
    "/browser-rendering/content";

  var response = UrlFetchApp.fetch(endpoint, {
    method: "post",
    muteHttpExceptions: true,
    contentType: "application/json",
    headers: {
      Authorization: "Bearer " + config.CLOUDFLARE_API_TOKEN,
    },
    payload: JSON.stringify({
      url: targetUrl,
      gotoOptions: {
        waitUntil: "load",
        timeout: BROWSER_TIMEOUT_MS,
      },
    }),
  });

  var status = response.getResponseCode();
  var text = String(response.getContentText() || "");

  if (status < 200 || status >= 300) {
    return failedBrowse_(
      startedAt,
      "Cloudflare HTTP " + status + ": " + text.slice(0, 300),
    );
  }

  try {
    var parsed = JSON.parse(text);
    if (parsed && parsed.success === false) {
      return failedBrowse_(startedAt, "Cloudflare rejected the browser request.");
    }
  } catch (parseErr) {}

  return resultFromHtml_(startedAt, true, extractHtmlFromCloudflare_(text), null);
}

function openWithCloudflare_(targetUrl) {
  var startedAt = Date.now();
  var config = getConfig_();

  if (config.LEADY_APP_URL) {
    try {
      var viaLeady = browseViaLeady_(targetUrl, startedAt);
      if (viaLeady) {
        return viaLeady;
      }
    } catch (leadyErr) {
      logManual_("Leady browse failed: " + leadyErr);
    }
  }

  try {
    return browseViaCloudflareDirect_(targetUrl, startedAt);
  } catch (cloudflareErr) {
    return failedBrowse_(
      startedAt,
      "Google Apps Script cannot reach Cloudflare directly (" +
        cloudflareErr +
        "). Add script property LEADY_APP_URL = your public Leady website, plus CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN on the Leady server.",
    );
  }
}

function reportComplete_(completeUrl, checkId, botId, pageOk, errorMessage) {
  var payload = signComplete_({
    action: "monitor_complete",
    checkId: checkId,
    botId: botId,
    pageOk: pageOk,
    errorMessage: errorMessage == null ? null : errorMessage,
  });

  UrlFetchApp.fetch(completeUrl, {
    method: "post",
    muteHttpExceptions: true,
    contentType: "application/json",
    payload: JSON.stringify(payload),
  });
}

function runCloudflareCheck_(websiteUrl) {
  logManual_("Opening website in Cloudflare: " + websiteUrl);
  var opened = openWithCloudflare_(websiteUrl);
  logManual_(
    "Cloudflare opened: " +
      (opened.pageOk ? "yes" : "no") +
      " | widget found: " +
      (opened.widgetFound ? "yes" : "no") +
      " | seconds: " +
      opened.seconds +
      (opened.errorMessage ? " | error: " + opened.errorMessage : ""),
  );
  return opened;
}

/**
 * Click Run on this function in the Apps Script editor.
 * Logs appear under Executions. Nothing is written to the sheet.
 */
function runManualInstallCheck() {
  var websiteUrl = String(MANUAL_TEST_WEBSITE || "").trim();
  if (!websiteUrl || websiteUrl.indexOf("https://example.com") === 0) {
    logManual_(
      "Set MANUAL_TEST_WEBSITE at the top of this file to your real website, then Run again.",
    );
    return;
  }

  logManual_("Manual test started.");
  runCloudflareCheck_(websiteUrl);
  logManual_("Manual test finished. Check Executions for this log.");
}

function enqueueCheck_(body) {
  PropertiesService.getScriptProperties().setProperty(
    "PENDING_" + body.checkId,
    JSON.stringify(body),
  );
  ScriptApp.newTrigger("drainMonitorQueue_").timeBased().after(1).create();
}

function deleteDrainTriggers_() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "drainMonitorQueue_") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}

function drainMonitorQueue_() {
  deleteDrainTriggers_();
  var props = PropertiesService.getScriptProperties();
  var keys = props.getKeys();
  var remaining = [];

  for (var i = 0; i < keys.length; i++) {
    if (keys[i].indexOf("PENDING_") !== 0) {
      continue;
    }
    remaining.push(keys[i]);
  }

  if (remaining.length === 0) {
    return;
  }

  var key = remaining[0];
  var raw = props.getProperty(key);
  props.deleteProperty(key);

  try {
    var body = JSON.parse(raw || "{}");
    var targetUrl = withCheckQuery_(body.websiteUrl, body.checkId);
    var opened = openWithCloudflare_(targetUrl);
    logAutomaticToSheet_(
      body.websiteUrl,
      body.botId,
      opened.pageOk,
      opened.widgetFound,
      opened.seconds,
      opened.errorMessage,
    );
    reportComplete_(
      body.completeUrl,
      body.checkId,
      body.botId,
      opened.pageOk,
      opened.errorMessage,
    );
  } catch (err) {
    try {
      var fallback = JSON.parse(raw || "{}");
      logAutomaticToSheet_(
        fallback.websiteUrl,
        fallback.botId,
        false,
        false,
        "",
        String(err && err.message ? err.message : err),
      );
      if (fallback.completeUrl && fallback.checkId && fallback.botId) {
        reportComplete_(
          fallback.completeUrl,
          fallback.checkId,
          fallback.botId,
          false,
          String(err && err.message ? err.message : err),
        );
      }
    } catch (reportErr) {}
  }

  if (remaining.length > 1) {
    ScriptApp.newTrigger("drainMonitorQueue_").timeBased().after(1).create();
  }
}

function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    if (!verifyCheck_(body)) {
      return jsonResponse_({ ok: false, error: "Unauthorized" });
    }

    enqueueCheck_(body);
    return jsonResponse_({ ok: true, accepted: true });
  } catch (err) {
    return jsonResponse_({
      ok: false,
      error: String(err && err.message ? err.message : err),
    });
  }
}
