var RUN_SOURCE_PROPERTY_PREFIX = 'RUN_SOURCE_';

function scheduleRunBuild_(sourceId) {
  PropertiesService.getScriptProperties().setProperty(RUN_SOURCE_PROPERTY_PREFIX + sourceId, sourceId);

  ScriptApp.newTrigger('runBuildFromTrigger_')
    .timeBased()
    .after(1000)
    .create();
}

function runBuildFromTrigger_() {
  var props = PropertiesService.getScriptProperties().getProperties();
  var sourceIds = [];

  Object.keys(props).forEach(function (key) {
    if (key.indexOf(RUN_SOURCE_PROPERTY_PREFIX) === 0) {
      sourceIds.push(props[key]);
    }
  });

  sourceIds.forEach(function (sourceId) {
    PropertiesService.getScriptProperties().deleteProperty(RUN_SOURCE_PROPERTY_PREFIX + sourceId);
    runBuild(sourceId);
  });
}

function clearRunTriggersForSource_(sourceId) {
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function (trigger) {
    if (trigger.getHandlerFunction() === 'runBuildFromTrigger_') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  PropertiesService.getScriptProperties().deleteProperty(RUN_SOURCE_PROPERTY_PREFIX + sourceId);
}

function scheduleContinue_(sourceId) {
  var config = getConfig_();
  var payload = signContinuePayload_(sourceId);
  UrlFetchApp.fetch(config.WEB_APP_URL, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
}

function signContinuePayload_(sourceId) {
  var source = getSource_(sourceId);
  if (!source) {
    throw new Error('Source not found for continue.');
  }

  var exp = Math.floor(Date.now() / 1000) + 600;
  var body = {
    action: 'continue',
    sourceId: sourceId,
    botId: source.bot_id,
    websiteUrl: source.website_url,
    exp: exp
  };

  var sig = Utilities.computeHmacSha256Signature(JSON.stringify(body), getConfig_().GAS_INGESTION_HMAC_SECRET)
    .map(function (byte) {
      var hex = (byte < 0 ? byte + 256 : byte).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    })
    .join('');

  body.sig = sig;
  return body;
}
