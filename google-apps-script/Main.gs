function getConfig_() {
  var props = PropertiesService.getScriptProperties();
  return {
  FIRECRAWL_API_KEY: props.getProperty('FIRECRAWL_API_KEY') || '',
  JINA_API_KEY: props.getProperty('JINA_API_KEY') || '',
  OPENROUTER_API_KEY: props.getProperty('OPENROUTER_API_KEY') || '',
  SUPABASE_URL: (props.getProperty('SUPABASE_URL') || '').replace(/\/$/, ''),
  SUPABASE_SERVICE_ROLE_KEY: props.getProperty('SUPABASE_SERVICE_ROLE_KEY') || '',
  GAS_INGESTION_HMAC_SECRET: props.getProperty('GAS_INGESTION_HMAC_SECRET') || '',
  OPENROUTER_EMBEDDING_MODEL: props.getProperty('OPENROUTER_EMBEDDING_MODEL') || 'openai/text-embedding-3-small',
  OPENROUTER_PAGE_SELECT_MODEL: props.getProperty('OPENROUTER_PAGE_SELECT_MODEL') || 'deepseek/deepseek-v4-flash',
  EMBEDDING_DIMENSIONS: Number(props.getProperty('EMBEDDING_DIMENSIONS') || '1536'),
  MIN_USABLE_WEBSITE_TEXT_CHARS: Number(props.getProperty('MIN_USABLE_WEBSITE_TEXT_CHARS') || '300'),
  GAS_STALE_PAGE_MINUTES: Number(props.getProperty('GAS_STALE_PAGE_MINUTES') || '15'),
  GAS_STUCK_SOURCE_MINUTES: Number(props.getProperty('GAS_STUCK_SOURCE_MINUTES') || '45'),
  WEB_APP_URL: props.getProperty('WEB_APP_URL') || ScriptApp.getService().getUrl()
  };
}

function jsonResponse_(payload, statusCode) {
  var output = ContentService.createTextOutput(JSON.stringify(payload));
  output.setMimeType(ContentService.MimeType.JSON);
  if (statusCode) {
    // Apps Script web apps cannot set arbitrary HTTP status codes easily;
    // include status in body for callers that need it.
    output.setContent(JSON.stringify(Object.assign({ statusCode: statusCode }, payload)));
  }
  return output;
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents || '{}');
    var action = body.action;

    if (!verifyRequestSignature_(body)) {
      return jsonResponse_({ accepted: false, error: 'Invalid signature.' }, 401);
    }

    if (action === 'start') {
      return handleStart_(body);
    }

    if (action === 'continue') {
      return handleContinue_(body);
    }

  return jsonResponse_({ accepted: false, error: 'Unknown action.' }, 400);
  } catch (err) {
    return jsonResponse_({ accepted: false, error: String(err && err.message ? err.message : err) }, 500);
  }
}

function handleStart_(body) {
  var sourceId = body.sourceId;
  if (!sourceId) {
    return jsonResponse_({ accepted: false, error: 'Missing sourceId.' }, 400);
  }

  updateSource_(sourceId, {
    status: 'discovering',
    updated_at: new Date().toISOString()
  });

  scheduleRunBuild_(sourceId);

  return jsonResponse_({ accepted: true, sourceId: sourceId }, 200);
}

function handleContinue_(body) {
  var sourceId = body.sourceId;
  if (!sourceId) {
    return jsonResponse_({ accepted: false, error: 'Missing sourceId.' }, 400);
  }

  runBuild(sourceId);
  return jsonResponse_({ accepted: true, sourceId: sourceId }, 200);
}

function runBuild(sourceId) {
  var config = getConfig_();
  var startedAt = Date.now();

  try {
    clearRunTriggersForSource_(sourceId);
    reclaimStaleProcessingPages_(sourceId, config.GAS_STALE_PAGE_MINUTES);

    var source = getSource_(sourceId);
    if (!source) {
      throw new Error('Source not found.');
    }

    if (isSourceStuck_(source, config.GAS_STUCK_SOURCE_MINUTES)) {
      updateSource_(sourceId, {
        status: 'failed',
        error_message: 'Build stopped because it ran too long without progress.',
        updated_at: new Date().toISOString()
      });
      return;
    }

    if (source.status === 'discovering') {
      runDiscoverPhase_(source, config);
      source = getSource_(sourceId);
    }

    if (!source || source.status !== 'processing') {
      return;
    }

    processPagesLoop_(source, config, startedAt);
  } catch (err) {
    handleBuildFailure_(sourceId, err);
  }
}

function isSourceStuck_(source, stuckMinutes) {
  if (source.status !== 'processing') {
    return false;
  }

  if (!source.last_processed_at) {
    var updatedAt = new Date(source.updated_at).getTime();
    return Date.now() - updatedAt > stuckMinutes * 60 * 1000;
  }

  var lastProcessed = new Date(source.last_processed_at).getTime();
  return Date.now() - lastProcessed > stuckMinutes * 60 * 1000;
}

function handleBuildFailure_(sourceId, err) {
  var message = String(err && err.message ? err.message : err);
  var source = getSource_(sourceId);
  var hasExistingChunks = countValidWebsiteChunks_(source ? source.bot_id : '');

  if (hasExistingChunks > 0) {
    updateSource_(sourceId, {
      status: 'partial',
      refresh_error_message: message,
      error_message: message,
      updated_at: new Date().toISOString()
    });
    return;
  }

  updateSource_(sourceId, {
    status: 'failed',
    error_message: message,
    updated_at: new Date().toISOString()
  });
}
