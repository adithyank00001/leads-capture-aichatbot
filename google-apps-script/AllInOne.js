/**
 * Website RAG Ingestion Worker — ALL-IN-ONE
 *
 * How to use:
 * 1. Go to https://script.google.com → New project
 * 2. Delete the default Code.gs content
 * 3. Paste this ENTIRE file into Code.gs
 * 4. Project Settings → Script properties → add your API keys (see bottom of file)
 * 5. Deploy → New deployment → Web app → Execute as: Me → Who has access: Anyone
 * 6. Copy the web app URL into Next.js .env.local as GAS_INGESTION_WEB_APP_URL
 */

// =============================================================================
// CONFIG
// =============================================================================

var RUN_SOURCE_PROPERTY_PREFIX = 'RUN_SOURCE_';
var MAX_RUN_MS = 4.5 * 60 * 1000;

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
    WEB_APP_URL: props.getProperty('WEB_APP_URL') || ScriptApp.getService().getUrl(),
    LOG_SHEET_ID: props.getProperty('LOG_SHEET_ID') || '',
    LOG_SHEET_TAB: props.getProperty('LOG_SHEET_TAB') || 'Logs'
  };
}

// =============================================================================
// LOGGING — Google Sheet + Supabase (visible in dashboard)
// =============================================================================

var GAS_CODE_VERSION = '2026-07-27-v4-map-primary';
var FIRECRAWL_MAP_MAX_ATTEMPTS = 3;
var MAX_SELECTED_WEBSITE_PAGES = 11;
var LOG_SHEET_HEADERS = ['Timestamp', 'Source ID', 'Bot ID', 'Step', 'Status', 'Message'];
var LOG_MESSAGE_MAX_LENGTH = 2000;

/**
 * Run once from Apps Script editor to create a log sheet.
 */
function createLogSheet() {
  var ss = SpreadsheetApp.create('Website RAG Logs');
  var sheet = ss.getActiveSheet();
  sheet.setName('Logs');
  sheet.appendRow(LOG_SHEET_HEADERS);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, LOG_SHEET_HEADERS.length).setFontWeight('bold');

  PropertiesService.getScriptProperties().setProperty('LOG_SHEET_ID', ss.getId());
  PropertiesService.getScriptProperties().setProperty('LOG_SHEET_TAB', 'Logs');

  Logger.log('Log sheet created: ' + ss.getUrl());
  return ss.getUrl();
}

function trimLogMessage_(message) {
  var text = String(message || '').replace(/\s+/g, ' ').trim();
  if (text.length > LOG_MESSAGE_MAX_LENGTH) {
    return text.substring(0, LOG_MESSAGE_MAX_LENGTH) + '...';
  }
  return text;
}

function logToSheet_(sourceId, botId, step, status, message) {
  try {
    var config = getConfig_();
    if (!config.LOG_SHEET_ID) {
      Logger.log('WARN: LOG_SHEET_ID not set. Run createLogSheet() once.');
      return;
    }

    var ss = SpreadsheetApp.openById(config.LOG_SHEET_ID);
    var sheet = ss.getSheetByName(config.LOG_SHEET_TAB);
    if (!sheet) {
      sheet = ss.insertSheet(config.LOG_SHEET_TAB);
    }

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(LOG_SHEET_HEADERS);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, LOG_SHEET_HEADERS.length).setFontWeight('bold');
    }

    sheet.appendRow([
      Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss'),
      sourceId || '',
      botId || '',
      step || '',
      status || '',
      trimLogMessage_(message)
    ]);
  } catch (logErr) {
    Logger.log('Sheet log failed: ' + logErr);
  }
}

function logToSupabase_(sourceId, botId, step, status, message) {
  try {
    var config = getConfig_();
    if (!config.SUPABASE_URL || !config.SUPABASE_SERVICE_ROLE_KEY || !botId) {
      return;
    }

    UrlFetchApp.fetch(config.SUPABASE_URL + '/rest/v1/bot_website_build_logs', {
      method: 'post',
      headers: {
        apikey: config.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: 'Bearer ' + config.SUPABASE_SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      payload: JSON.stringify({
        source_id: sourceId || null,
        bot_id: botId,
        side: 'gas',
        step: step,
        status: status,
        message: trimLogMessage_(message)
      }),
      muteHttpExceptions: true
    });
  } catch (logErr) {
    Logger.log('Supabase log failed: ' + logErr);
  }
}

function logBuild_(sourceId, botId, step, status, message) {
  var line = '[' + step + '] ' + status + (message ? ': ' + message : '');
  Logger.log(line);
  logToSheet_(sourceId, botId, step, status, message);
  logToSupabase_(sourceId, botId, step, status, message);
}

function logErrorDetail_(sourceId, botId, step, err) {
  var message = String(err && err.message ? err.message : err);
  var stack = err && err.stack ? String(err.stack) : '';
  logBuild_(sourceId, botId, step, 'error', message + (stack ? ' | stack: ' + stack : ''));
}

function logConfigStatus_(sourceId, botId) {
  var config = getConfig_();
  var flags = [
    'CODE_VERSION=' + GAS_CODE_VERSION,
    'typeof URL=' + (typeof URL),
    'FIRECRAWL=' + (config.FIRECRAWL_API_KEY ? 'set' : 'MISSING'),
    'JINA=' + (config.JINA_API_KEY ? 'set' : 'MISSING'),
    'OPENROUTER=' + (config.OPENROUTER_API_KEY ? 'set' : 'MISSING'),
    'SUPABASE_URL=' + (config.SUPABASE_URL ? 'set' : 'MISSING'),
    'SUPABASE_KEY=' + (config.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'MISSING'),
    'HMAC_SECRET=' + (config.GAS_INGESTION_HMAC_SECRET ? 'set' : 'MISSING'),
    'LOG_SHEET_ID=' + (config.LOG_SHEET_ID ? 'set' : 'MISSING — run createLogSheet()'),
    'WEB_APP_URL=' + (config.WEB_APP_URL || 'missing')
  ];
  logBuild_(sourceId, botId, 'config', 'info', flags.join(' | '));
}

// =============================================================================
// AUTH (HMAC signature check)
// =============================================================================

function verifyRequestSignature_(body) {
  var config = getConfig_();
  if (!config.GAS_INGESTION_HMAC_SECRET) {
    return false;
  }

  var sig = body.sig;
  if (!sig || !body.exp) {
    return false;
  }

  if (Number(body.exp) < Math.floor(Date.now() / 1000)) {
    return false;
  }

  var canonical = JSON.stringify({
    action: body.action,
    sourceId: body.sourceId,
    botId: body.botId,
    websiteUrl: body.websiteUrl,
    exp: body.exp
  });

  var expected = Utilities.computeHmacSha256Signature(canonical, config.GAS_INGESTION_HMAC_SECRET)
    .map(function (byte) {
      var hex = (byte < 0 ? byte + 256 : byte).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    })
    .join('');

  return expected === sig;
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

// =============================================================================
// TRIGGERS (schedule work without blocking)
// =============================================================================

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

// =============================================================================
// MAIN ENTRY (web app)
// =============================================================================

function jsonResponse_(payload, statusCode) {
  var output = ContentService.createTextOutput(JSON.stringify(payload));
  output.setMimeType(ContentService.MimeType.JSON);
  if (statusCode) {
    output.setContent(JSON.stringify(Object.assign({ statusCode: statusCode }, payload)));
  }
  return output;
}

function doPost(e) {
  try {
    logBuild_('', '', 'webhook', 'received', 'doPost called. CODE ' + GAS_CODE_VERSION);

    var body = JSON.parse(e.postData.contents || '{}');
    var action = body.action;

    logBuild_(body.sourceId || '', body.botId || '', 'webhook', 'parsed', 'action=' + action);

    if (!verifyRequestSignature_(body)) {
      logBuild_(body.sourceId || '', body.botId || '', 'auth', 'error', 'Invalid HMAC signature.');
      return jsonResponse_({ accepted: false, error: 'Invalid signature.' }, 401);
    }

    logBuild_(body.sourceId || '', body.botId || '', 'auth', 'passed', 'HMAC signature valid.');

    if (action === 'start') {
      return handleStart_(body);
    }

    if (action === 'continue') {
      return handleContinue_(body);
    }

    return jsonResponse_({ accepted: false, error: 'Unknown action.' }, 400);
  } catch (err) {
    logErrorDetail_('', '', 'webhook', err);
    var errMessage = String(err && err.message ? err.message : err);
    return jsonResponse_({ accepted: false, error: errMessage }, 500);
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

  logBuild_(sourceId, body.botId || '', 'start', 'accepted', 'Build accepted. Worker scheduled.');

  return jsonResponse_({ accepted: true, sourceId: sourceId }, 200);
}

function handleContinue_(body) {
  var sourceId = body.sourceId;
  if (!sourceId) {
    return jsonResponse_({ accepted: false, error: 'Missing sourceId.' }, 400);
  }

  logBuild_(sourceId, body.botId || '', 'continue', 'accepted', 'Continue action received.');

  runBuild(sourceId);
  return jsonResponse_({ accepted: true, sourceId: sourceId }, 200);
}

function runBuild(sourceId) {
  var config = getConfig_();
  var startedAt = Date.now();

  try {
    logBuild_(sourceId, '', 'run', 'entered', 'runBuild started. CODE ' + GAS_CODE_VERSION);
    logConfigStatus_(sourceId, '');

    clearRunTriggersForSource_(sourceId);
    logBuild_(sourceId, '', 'run', 'step', 'Cleared old triggers.');

    var reclaimResult = reclaimStaleProcessingPages_(sourceId, config.GAS_STALE_PAGE_MINUTES);
    logBuild_(sourceId, '', 'run', 'step', 'reclaim_stale_processing_pages done.');

    var source = getSource_(sourceId);
    if (!source) {
      throw new Error('Source not found in Supabase for id: ' + sourceId);
    }

    logConfigStatus_(sourceId, source.bot_id);
    logBuild_(sourceId, source.bot_id, 'run', 'started', 'Source loaded. status=' + source.status + ' url=' + source.website_url);

    if (reclaimResult && (reclaimResult.reset || reclaimResult.failed)) {
      logBuild_(
        sourceId,
        source.bot_id,
        'reclaim',
        'info',
        'Reclaimed stale pages. Reset: ' + (reclaimResult.reset || 0) + ', failed: ' + (reclaimResult.failed || 0)
      );
    }

    if (isSourceStuck_(source, config.GAS_STUCK_SOURCE_MINUTES)) {
      logBuild_(sourceId, source.bot_id, 'run', 'error', 'Build stuck too long without progress.');
      updateSource_(sourceId, {
        status: 'failed',
        error_message: 'Build stopped because it ran too long without progress.',
        updated_at: new Date().toISOString()
      });
      return;
    }

    if (source.status === 'discovering') {
      logBuild_(sourceId, source.bot_id, 'discover', 'step', 'Entering discover phase.');
      runDiscoverPhase_(source, config);
      source = getSource_(sourceId);
      logBuild_(sourceId, source ? source.bot_id : '', 'discover', 'step', 'Discover phase finished. New status=' + (source ? source.status : 'null'));
    }

    if (!source || source.status !== 'processing') {
      logBuild_(sourceId, source ? source.bot_id : '', 'run', 'exit', 'Not entering process loop. status=' + (source ? source.status : 'null'));
      return;
    }

    logBuild_(sourceId, source.bot_id, 'process', 'step', 'Entering page processing loop.');
    processPagesLoop_(source, config, startedAt);
  } catch (err) {
    logErrorDetail_(sourceId, '', 'run', err);
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
  var stack = err && err.stack ? String(err.stack) : '';
  var source = getSource_(sourceId);
  var hasExistingChunks = countValidWebsiteChunks_(source ? source.bot_id : '');

  logBuild_(
    sourceId,
    source ? source.bot_id : '',
    'run',
    'failed',
    message + (stack ? ' | ' + stack : '')
  );

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

// =============================================================================
// SUPABASE (database calls)
// =============================================================================

function supabaseRequest_(method, path, body, prefer) {
  var config = getConfig_();
  var options = {
    method: method,
    muteHttpExceptions: true,
    headers: {
      apikey: config.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: 'Bearer ' + config.SUPABASE_SERVICE_ROLE_KEY,
      'Content-Type': 'application/json'
    }
  };

  if (prefer) {
    options.headers.Prefer = prefer;
  }

  if (body !== undefined && body !== null) {
    options.payload = JSON.stringify(body);
  }

  var response = UrlFetchApp.fetch(config.SUPABASE_URL + path, options);
  var text = response.getContentText();
  var status = response.getResponseCode();

  if (status >= 400) {
    throw new Error('Supabase error ' + status + ': ' + text);
  }

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    return text;
  }
}

function getSource_(sourceId) {
  var rows = supabaseRequest_('get', '/rest/v1/bot_website_sources?id=eq.' + encodeURIComponent(sourceId) + '&limit=1', null);
  return rows && rows.length ? rows[0] : null;
}

function updateSource_(sourceId, patch) {
  return supabaseRequest_(
    'patch',
    '/rest/v1/bot_website_sources?id=eq.' + encodeURIComponent(sourceId),
    patch,
    'return=representation'
  );
}

function rpc_(name, params) {
  return supabaseRequest_('post', '/rest/v1/rpc/' + name, params || {});
}

function claimNextWebsitePage_(sourceId) {
  var rows = rpc_('claim_next_website_page', { p_source_id: sourceId });
  return rows && rows.length ? rows[0] : null;
}

function reclaimStaleProcessingPages_(sourceId, staleMinutes) {
  return rpc_('reclaim_stale_processing_pages', {
    p_source_id: sourceId,
    p_stale_minutes: staleMinutes
  });
}

function replacePageChunks_(pageId, chunks) {
  return rpc_('replace_page_chunks', {
    p_page_id: pageId,
    p_chunks: chunks
  });
}

function cleanupStaleWebsitePages_(sourceId, normalizedUrls) {
  return rpc_('cleanup_stale_website_pages', {
    p_source_id: sourceId,
    p_selected_normalized_urls: normalizedUrls
  });
}

function countValidWebsiteChunks_(botId) {
  return rpc_('count_valid_website_chunks', { p_bot_id: botId }) || 0;
}

function upsertWebsitePages_(pages) {
  if (!pages.length) {
    return [];
  }

  return supabaseRequest_(
    'post',
    '/rest/v1/bot_website_pages?on_conflict=source_id,normalized_url',
    pages,
    'resolution=merge-duplicates,return=representation'
  );
}

function updateWebsitePage_(pageId, patch) {
  return supabaseRequest_(
    'patch',
    '/rest/v1/bot_website_pages?id=eq.' + encodeURIComponent(pageId),
    patch,
    'return=representation'
  );
}

function countPagesByStatus_(sourceId, status) {
  var rows = supabaseRequest_(
    'get',
    '/rest/v1/bot_website_pages?source_id=eq.' + encodeURIComponent(sourceId) + '&status=eq.' + status + '&select=id',
    null
  );
  return rows ? rows.length : 0;
}

function getTotalUsableTextChars_(sourceId) {
  var rows = supabaseRequest_(
    'get',
    '/rest/v1/bot_website_chunks?source_id=eq.' + encodeURIComponent(sourceId) + '&select=chunk_content',
    null
  );

  var total = 0;
  (rows || []).forEach(function (row) {
    total += String(row.chunk_content || '').length;
  });
  return total;
}

function getSelectedNormalizedUrls_(source) {
  var selected = source.selected_urls;
  if (!selected) {
    return [];
  }

  if (Array.isArray(selected)) {
    return selected.map(function (item) {
      return typeof item === 'string' ? item : item.normalized_url || item.normalizedUrl || '';
    }).filter(Boolean);
  }

  if (selected.normalized_urls && Array.isArray(selected.normalized_urls)) {
    return selected.normalized_urls;
  }

  return [];
}

// =============================================================================
// URL HELPERS (no URL() constructor — not available in all Apps Script runtimes)
// =============================================================================

function parseUrlParts_(rawUrl, baseOrigin) {
  var input = String(rawUrl || '').trim();
  if (!input) {
    return null;
  }

  if (input.indexOf('://') === -1 && baseOrigin) {
    var base = String(baseOrigin).replace(/\/$/, '');
    input = base + (input.charAt(0) === '/' ? input : '/' + input);
  }

  if (input.indexOf('://') === -1) {
    input = 'https://' + input;
  }

  var match = input.match(/^(https?:)\/\/([^/?#]+)([^?#]*)?(\?[^#]*)?(#.*)?$/i);
  if (!match) {
    return null;
  }

  var protocol = match[1].toLowerCase();
  var host = match[2];
  var pathname = match[3] || '/';
  var search = match[4] || '';
  var hash = match[5] || '';

  if (!pathname) {
    pathname = '/';
  }

  var hostname = host.replace(/:\d+$/, '');
  var origin = protocol + '//' + host;

  return {
    href: origin + pathname + search,
    origin: origin,
    hostname: hostname,
    pathname: pathname,
    search: search,
    hash: hash
  };
}

function stripTrackingParams_(search) {
  if (!search || search === '?') {
    return '';
  }

  var query = search.charAt(0) === '?' ? search.slice(1) : search;
  var parts = query.split('&').filter(function (part) {
    if (!part) {
      return false;
    }
    var key = part.split('=')[0].toLowerCase();
    if (key.indexOf('utm_') === 0 || key === 'fbclid' || key === 'gclid') {
      return false;
    }
    return true;
  });

  return parts.length ? '?' + parts.join('&') : '';
}

function normalizeWebsiteUrl_(input) {
  var trimmed = String(input || '').trim();
  if (!trimmed) {
    return '';
  }

  var parts = parseUrlParts_(trimmed);
  if (!parts) {
    return '';
  }

  var pathname = parts.pathname;
  if (pathname !== '/' && pathname.slice(-1) === '/') {
    pathname = pathname.slice(0, -1);
  }

  return parts.origin + pathname + stripTrackingParams_(parts.search);
}

function normalizePageUrl_(url, baseOrigin) {
  try {
    var parts = parseUrlParts_(url, baseOrigin);
    if (!parts) {
      return '';
    }

    var pathname = parts.pathname;
    if (pathname !== '/' && pathname.slice(-1) === '/') {
      pathname = pathname.slice(0, -1);
    }

    return parts.origin + pathname + stripTrackingParams_(parts.search);
  } catch (e) {
    return '';
  }
}

function getNormalizedPathKey_(url, baseOrigin) {
  try {
    var parts = parseUrlParts_(url, baseOrigin);
    if (!parts) {
      return '';
    }

    var host = parts.hostname.replace(/^www\./i, '').toLowerCase();
    var path = parts.pathname === '/' ? '/' : parts.pathname.replace(/\/$/, '');
    var search = stripTrackingParams_(parts.search);
    return host + path + search;
  } catch (e) {
    return '';
  }
}

function isSameWebsiteDomain_(url, allowedHost) {
  try {
    var parts = parseUrlParts_(url);
    if (!parts) {
      return false;
    }

    var host = parts.hostname.replace(/^www\./i, '').toLowerCase();
    var allowed = String(allowedHost || '').replace(/^www\./i, '').toLowerCase();
    return host === allowed || host.slice(-1 * (allowed.length + 1)) === '.' + allowed;
  } catch (e) {
    return false;
  }
}

function isNonPageUrl_(url) {
  var lower = String(url || '').trim().toLowerCase();
  if (!lower || lower === '#') {
    return true;
  }

  if (lower.indexOf('mailto:') === 0 || lower.indexOf('tel:') === 0 || lower.indexOf('javascript:') === 0) {
    return true;
  }

  return /\.(pdf|jpg|jpeg|png|gif|webp|svg|zip|rar|mp4|mp3|doc|docx|xls|xlsx|ppt|pptx)$/i.test(lower);
}

function filterDiscoveredUrls_(websiteUrl, links) {
  var websiteParts = parseUrlParts_(websiteUrl);
  if (!websiteParts) {
    return [];
  }

  var origin = websiteParts.origin;
  var allowedHost = websiteParts.hostname;
  var seen = {};
  var result = [];

  (links || []).forEach(function (link) {
    if (isNonPageUrl_(link)) {
      return;
    }

    var normalized = normalizePageUrl_(link, origin);
    if (!normalized || !isSameWebsiteDomain_(normalized, allowedHost)) {
      return;
    }

    var key = getNormalizedPathKey_(normalized, origin);
    if (!key || seen[key]) {
      return;
    }

    seen[key] = true;
    result.push(normalized);
  });

  return result;
}

// =============================================================================
// FIRECRAWL (find links on website)
// =============================================================================

function discoverLinksWithFirecrawl_(sourceId, botId, websiteUrl, config) {
  var attempt;
  var links = [];

  for (attempt = 1; attempt <= FIRECRAWL_MAP_MAX_ATTEMPTS; attempt += 1) {
    logBuild_(
      sourceId,
      botId,
      'firecrawl',
      'step',
      'POST /v1/map attempt ' + attempt + '/' + FIRECRAWL_MAP_MAX_ATTEMPTS + ' for ' + websiteUrl
    );

    var mapResult = fetchFirecrawlMapLinks_(sourceId, botId, websiteUrl, config);
    if (mapResult.links && mapResult.links.length) {
      links = mapResult.links;
      logBuild_(
        sourceId,
        botId,
        'firecrawl',
        'success',
        'Map attempt ' + attempt + ' found ' + links.length + ' link(s).'
      );
      logDiscoveredLinks_(sourceId, botId, links);
      return links;
    }

    logBuild_(
      sourceId,
      botId,
      'firecrawl',
      'warn',
      'Map attempt ' + attempt + ' returned no links. ' + (mapResult.error || '')
    );

    if (attempt < FIRECRAWL_MAP_MAX_ATTEMPTS) {
      Utilities.sleep(2000);
    }
  }

  logBuild_(
    sourceId,
    botId,
    'firecrawl',
    'step',
    'Map failed after ' + FIRECRAWL_MAP_MAX_ATTEMPTS + ' attempts. Last resort: POST /v1/scrape for ' + websiteUrl
  );

  var scrapeResult = fetchFirecrawlScrapeLinks_(sourceId, botId, websiteUrl, config);
  links = scrapeResult.links || [];

  if (links.length) {
    logBuild_(sourceId, botId, 'firecrawl', 'success', 'Scrape fallback found ' + links.length + ' link(s).');
  } else {
    logBuild_(sourceId, botId, 'firecrawl', 'error', 'Scrape fallback also returned no links. ' + (scrapeResult.error || ''));
  }

  logDiscoveredLinks_(sourceId, botId, links);
  return links;
}

function fetchFirecrawlMapLinks_(sourceId, botId, websiteUrl, config) {
  try {
    var mapResponse = UrlFetchApp.fetch('https://api.firecrawl.dev/v1/map', {
      method: 'post',
      contentType: 'application/json',
      headers: {
        Authorization: 'Bearer ' + config.FIRECRAWL_API_KEY
      },
      payload: JSON.stringify({
        url: websiteUrl,
        limit: 50
      }),
      muteHttpExceptions: true
    });

    var mapStatus = mapResponse.getResponseCode();
    var mapText = mapResponse.getContentText() || '{}';
    logBuild_(sourceId, botId, 'firecrawl', 'http', 'map status=' + mapStatus + ' body=' + mapText.slice(0, 300));

    if (mapStatus < 200 || mapStatus >= 300) {
      return { links: [], error: 'HTTP ' + mapStatus };
    }

    var mapJson = JSON.parse(mapText);
    if (mapJson.success === false) {
      return { links: [], error: mapJson.error || 'map success=false' };
    }

    var mapLinks = mapJson.links || (mapJson.data && mapJson.data.links) || [];
    return { links: dedupeUrls_(mapLinks) };
  } catch (e) {
    return { links: [], error: String(e.message || e) };
  }
}

function fetchFirecrawlScrapeLinks_(sourceId, botId, websiteUrl, config) {
  try {
    var scrapeResponse = UrlFetchApp.fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'post',
      contentType: 'application/json',
      headers: {
        Authorization: 'Bearer ' + config.FIRECRAWL_API_KEY
      },
      payload: JSON.stringify({
        url: websiteUrl,
        formats: ['links'],
        onlyMainContent: false
      }),
      muteHttpExceptions: true
    });

    var scrapeStatus = scrapeResponse.getResponseCode();
    var scrapeText = scrapeResponse.getContentText() || '{}';
    logBuild_(sourceId, botId, 'firecrawl', 'http', 'scrape status=' + scrapeStatus + ' body=' + scrapeText.slice(0, 300));

    if (scrapeStatus < 200 || scrapeStatus >= 300) {
      return { links: [], error: 'HTTP ' + scrapeStatus };
    }

    var scrapeJson = JSON.parse(scrapeText);
    var links = [];

    if (scrapeJson.data && scrapeJson.data.links) {
      links = scrapeJson.data.links;
    } else if (scrapeJson.links) {
      links = scrapeJson.links;
    }

    return { links: dedupeUrls_(links) };
  } catch (e) {
    return { links: [], error: String(e.message || e) };
  }
}

function logDiscoveredLinks_(sourceId, botId, links) {
  if (!links || !links.length) {
    return;
  }

  var preview = links.slice(0, 20).join('\n');
  if (links.length > 20) {
    preview += '\n... and ' + (links.length - 20) + ' more';
  }

  logBuild_(sourceId, botId, 'firecrawl', 'info', 'Discovered URLs:\n' + preview);
}

function formatUrlListForLog_(label, urls) {
  var list = urls || [];
  if (!list.length) {
    return label + ' (0)';
  }

  var preview = list.slice(0, 20).join('\n');
  if (list.length > 20) {
    preview += '\n... and ' + (list.length - 20) + ' more';
  }

  return label + ' (' + list.length + '):\n' + preview;
}

function dedupeUrls_(urls) {
  var seen = {};
  var result = [];
  (urls || []).forEach(function (url) {
    if (!url || seen[url]) {
      return;
    }
    seen[url] = true;
    result.push(url);
  });
  return result;
}

// =============================================================================
// AI PAGE SELECTION (DeepSeek via OpenRouter)
// =============================================================================

function selectPagesWithAi_(websiteUrl, discoveredUrls, config) {
  var prompt = [
    'You are helping choose the most useful public website pages for a business chatbot.',
    'Homepage: ' + websiteUrl,
    'Choose up to ' + MAX_SELECTED_WEBSITE_PAGES + ' URLs from the discovered list.',
    'Always include the homepage.',
    'Prefer about, services, pricing, contact, FAQ, and product pages.',
    'Return strict JSON only: {"selected_urls":["https://..."]}',
    'Discovered URLs:',
    JSON.stringify(discoveredUrls)
  ].join('\n');

  var response = UrlFetchApp.fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + config.OPENROUTER_API_KEY,
      'HTTP-Referer': websiteUrl,
      'X-Title': 'Website RAG Page Select'
    },
    payload: JSON.stringify({
      model: config.OPENROUTER_PAGE_SELECT_MODEL,
      messages: [
        { role: 'system', content: 'Return valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1
    }),
    muteHttpExceptions: true
  });

  var json = JSON.parse(response.getContentText() || '{}');
  var content = json.choices && json.choices[0] && json.choices[0].message
    ? json.choices[0].message.content
    : '';

  var parsed = parseJsonFromModel_(content);
  var selected = parsed && parsed.selected_urls ? parsed.selected_urls : [];

  return validateSelectedUrls_(websiteUrl, selected, discoveredUrls);
}

function parseJsonFromModel_(content) {
  if (!content) {
    return { selected_urls: [] };
  }

  var trimmed = String(content).trim();
  if (trimmed.indexOf('```') !== -1) {
    trimmed = trimmed.replace(/```json/gi, '').replace(/```/g, '').trim();
  }

  try {
    return JSON.parse(trimmed);
  } catch (e) {
    var match = trimmed.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error('AI page selection returned invalid JSON.');
  }
}

function validateSelectedUrls_(websiteUrl, selectedUrls, discoveredUrls) {
  var discoveredSet = {};
  discoveredUrls.forEach(function (url) {
    discoveredSet[normalizePageUrl_(url, websiteUrl)] = url;
  });

  var homepageKey = normalizePageUrl_(websiteUrl, websiteUrl);
  var normalizedSelected = [];
  var seen = {};

  (selectedUrls || []).forEach(function (url) {
    var normalized = normalizePageUrl_(url, websiteUrl);
    if (!normalized || !discoveredSet[normalized] || seen[normalized]) {
      return;
    }
    seen[normalized] = true;
    normalizedSelected.push(discoveredSet[normalized]);
  });

  if (!seen[homepageKey]) {
    normalizedSelected.unshift(websiteUrl);
  }

  return normalizedSelected.slice(0, MAX_SELECTED_WEBSITE_PAGES);
}

// =============================================================================
// JINA (read page content)
// =============================================================================

function fetchPageContentWithJina_(pageUrl, config) {
  var encodedUrl = encodeURI(pageUrl);
  var response = UrlFetchApp.fetch('https://r.jina.ai/' + encodedUrl, {
    method: 'get',
    headers: {
      Authorization: 'Bearer ' + config.JINA_API_KEY,
      Accept: 'application/json',
      'X-Timeout': '30'
    },
    muteHttpExceptions: true
  });

  var status = response.getResponseCode();
  var text = response.getContentText();

  if (status >= 400) {
    throw new Error('Jina fetch failed (' + status + ').');
  }

  var json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    return {
      title: '',
      content: text
    };
  }

  var content = json.data && json.data.content ? json.data.content : (json.content || text);
  var title = json.data && json.data.title ? json.data.title : (json.title || '');

  return {
    title: title,
    content: content
  };
}

// =============================================================================
// CHUNKING (split content into pieces)
// =============================================================================

function chunkMarkdownContent_(markdown, pageUrl, pageTitle) {
  var text = String(markdown || '').trim();
  if (!text) {
    return [];
  }

  var sections = splitByHeadings_(text);
  if (sections.length > 1) {
    return sections.map(function (section, index) {
      return {
        source_url: pageUrl,
        page_title: pageTitle || '',
        heading: section.heading,
        chunk_content: section.content,
        chunk_order: index
      };
    });
  }

  return splitParagraphChunks_(text, pageUrl, pageTitle);
}

function splitByHeadings_(text) {
  var lines = text.split('\n');
  var sections = [];
  var currentHeading = '';
  var currentLines = [];

  lines.forEach(function (line) {
    if (/^#{2,3}\s+/.test(line)) {
      if (currentLines.length) {
        sections.push({
          heading: currentHeading || 'Section',
          content: currentLines.join('\n').trim()
        });
      }
      currentHeading = line.replace(/^#{2,3}\s+/, '').trim();
      currentLines = [];
      return;
    }
    currentLines.push(line);
  });

  if (currentLines.length) {
    sections.push({
      heading: currentHeading || 'Section',
      content: currentLines.join('\n').trim()
    });
  }

  return sections.filter(function (section) {
    return section.content && section.content.length >= 80;
  });
}

function splitParagraphChunks_(text, pageUrl, pageTitle) {
  var paragraphs = text.split(/\n{2,}/).map(function (p) { return p.trim(); }).filter(Boolean);
  var chunks = [];
  var buffer = '';
  var chunkOrder = 0;

  paragraphs.forEach(function (paragraph) {
    if ((buffer + '\n\n' + paragraph).length > 800 && buffer) {
      chunks.push({
        source_url: pageUrl,
        page_title: pageTitle || '',
        heading: 'Content',
        chunk_content: buffer.trim(),
        chunk_order: chunkOrder++
      });
      buffer = paragraph;
      return;
    }

    buffer = buffer ? buffer + '\n\n' + paragraph : paragraph;
  });

  if (buffer.trim()) {
    chunks.push({
      source_url: pageUrl,
      page_title: pageTitle || '',
      heading: 'Content',
      chunk_content: buffer.trim(),
      chunk_order: chunkOrder
    });
  }

  return chunks;
}

function hashContent_(text) {
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text);
  return digest.map(function (byte) {
    var hex = (byte < 0 ? byte + 256 : byte).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

// =============================================================================
// EMBEDDINGS (create vectors via OpenRouter)
// =============================================================================

function embedTexts_(texts, config) {
  if (!texts.length) {
    return [];
  }

  var response = UrlFetchApp.fetch('https://openrouter.ai/api/v1/embeddings', {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + config.OPENROUTER_API_KEY
    },
    payload: JSON.stringify({
      model: config.OPENROUTER_EMBEDDING_MODEL,
      input: texts,
      dimensions: config.EMBEDDING_DIMENSIONS
    }),
    muteHttpExceptions: true
  });

  var json = JSON.parse(response.getContentText() || '{}');

  if (!json.data || !json.data.length) {
    throw new Error('Embedding provider returned no vectors.');
  }

  return json.data.map(function (item) {
    return '[' + item.embedding.join(',') + ']';
  });
}

function attachEmbeddingsToChunks_(chunks, config) {
  var texts = chunks.map(function (chunk) { return chunk.chunk_content; });
  var vectors = embedTexts_(texts, config);
  var scrapedAt = new Date().toISOString();

  return chunks.map(function (chunk, index) {
    return {
      source_url: chunk.source_url,
      page_title: chunk.page_title,
      heading: chunk.heading,
      chunk_content: chunk.chunk_content,
      chunk_order: chunk.chunk_order,
      content_hash: hashContent_(chunk.chunk_content),
      scraped_at: scrapedAt,
      embedding: vectors[index],
      embedding_model: config.OPENROUTER_EMBEDDING_MODEL,
      embedding_dimensions: config.EMBEDDING_DIMENSIONS
    };
  });
}

// =============================================================================
// DISCOVER (find + select pages)
// =============================================================================

function runDiscoverPhase_(source, config) {
  logBuild_(source.id, source.bot_id, 'discover', 'step', 'Raw input URL: ' + source.website_url);

  var websiteUrl = normalizeWebsiteUrl_(source.website_url);
  logBuild_(source.id, source.bot_id, 'discover', 'step', 'Normalized URL: ' + websiteUrl);

  if (!websiteUrl) {
    throw new Error('Could not normalize website URL.');
  }

  logBuild_(source.id, source.bot_id, 'discover', 'step', 'Calling Firecrawl...');
  var rawLinks = discoverLinksWithFirecrawl_(source.id, source.bot_id, websiteUrl, config);
  logBuild_(source.id, source.bot_id, 'discover', 'step', 'Firecrawl returned ' + rawLinks.length + ' raw link(s).');

  logBuild_(source.id, source.bot_id, 'discover', 'step', 'Filtering same-domain links...');
  var discoveredUrls = filterDiscoveredUrls_(websiteUrl, rawLinks);

  if (!discoveredUrls.length) {
    discoveredUrls = [websiteUrl];
    logBuild_(source.id, source.bot_id, 'discover', 'step', 'No links found. Using homepage only.');
  }

  logBuild_(source.id, source.bot_id, 'discover', 'info', formatUrlListForLog_('Usable links', discoveredUrls));

  logBuild_(source.id, source.bot_id, 'discover', 'step', 'Calling AI page selection...');
  var selectedUrls = selectPagesWithAi_(websiteUrl, discoveredUrls, config);
  logBuild_(source.id, source.bot_id, 'discover', 'success', formatUrlListForLog_('AI selected pages', selectedUrls));

  var websiteParts = parseUrlParts_(websiteUrl);
  if (!websiteParts) {
    throw new Error('Invalid website URL after parseUrlParts_.');
  }

  var origin = websiteParts.origin;
  logBuild_(source.id, source.bot_id, 'discover', 'step', 'Origin: ' + origin);
  var normalizedSelected = selectedUrls.map(function (url) {
    return getNormalizedPathKey_(url, origin);
  });

  var pageRows = selectedUrls.map(function (url, index) {
    return {
      source_id: source.id,
      bot_id: source.bot_id,
      page_url: url,
      normalized_url: getNormalizedPathKey_(url, origin),
      page_title: '',
      sort_order: index,
      status: 'pending',
      processing_started_at: null,
      reclaim_count: 0,
      updated_at: new Date().toISOString()
    };
  });

  upsertWebsitePages_(pageRows);

  updateSource_(source.id, {
    status: 'processing',
    website_url: websiteUrl,
    total_pages: selectedUrls.length,
    completed_pages: 0,
    failed_pages: 0,
    current_page_index: 0,
    selected_urls: {
      urls: selectedUrls,
      normalized_urls: normalizedSelected
    },
    error_message: null,
    refresh_error_message: null,
    embedding_model: config.OPENROUTER_EMBEDDING_MODEL,
    embedding_dimensions: config.EMBEDDING_DIMENSIONS,
    last_processed_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
}

// =============================================================================
// PROCESS (read each page one by one)
// =============================================================================

function processPagesLoop_(source, config, startedAt) {
  while (Date.now() - startedAt < MAX_RUN_MS) {
    reclaimStaleProcessingPages_(source.id, config.GAS_STALE_PAGE_MINUTES);

    var page = claimNextWebsitePage_(source.id);
    if (!page) {
      var pendingCount = countPagesByStatus_(source.id, 'pending');
      var processingCount = countPagesByStatus_(source.id, 'processing');

      if (pendingCount === 0 && processingCount === 0) {
        finalizeBuild_(source.id, config);
      }

      return;
    }

    processSinglePage_(source, page, config);

    source = getSource_(source.id);
    if (!source) {
      return;
    }

    updateSource_(source.id, {
      current_page_index: source.completed_pages + source.failed_pages,
      last_processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }

  logBuild_(source.id, source.bot_id, 'continue', 'scheduled', 'Time limit reached. Scheduling continue run.');
  scheduleContinue_(source.id);
}

function processSinglePage_(source, page, config) {
  var attempts = 0;
  var lastError = null;

  logBuild_(source.id, source.bot_id, 'process_page', 'started', 'Processing: ' + page.page_url);

  while (attempts < 2) {
    attempts += 1;

    try {
      var jina = fetchPageContentWithJina_(page.page_url, config);
      var content = String(jina.content || '').trim();

      if (content.length < 150) {
        throw new Error('Page content was too short.');
      }

      var chunks = chunkMarkdownContent_(content, page.page_url, jina.title || page.page_title || '');
      if (!chunks.length) {
        throw new Error('No chunks were created from page content.');
      }

      var embeddedChunks = attachEmbeddingsToChunks_(chunks, config);
      replacePageChunks_(page.id, embeddedChunks);

      updateWebsitePage_(page.id, {
        status: 'completed',
        page_title: jina.title || page.page_title || '',
        content_hash: hashContent_(content),
        processing_started_at: null,
        processed_at: new Date().toISOString(),
        error_message: null,
        updated_at: new Date().toISOString()
      });

      updateSource_(source.id, {
        completed_pages: (getSource_(source.id).completed_pages || 0) + 1,
        updated_at: new Date().toISOString()
      });

      logBuild_(
        source.id,
        source.bot_id,
        'process_page',
        'success',
        'Completed: ' + page.page_url + ' (' + chunks.length + ' chunk(s))'
      );

      return;
    } catch (err) {
      lastError = err;
    }
  }

  updateWebsitePage_(page.id, {
    status: 'failed',
    processing_started_at: null,
    error_message: String(lastError && lastError.message ? lastError.message : lastError),
    updated_at: new Date().toISOString()
  });

  updateSource_(source.id, {
    failed_pages: (getSource_(source.id).failed_pages || 0) + 1,
    updated_at: new Date().toISOString()
  });

  logBuild_(
    source.id,
    source.bot_id,
    'process_page',
    'error',
    'Failed: ' + page.page_url + ' - ' + String(lastError && lastError.message ? lastError.message : lastError)
  );
}

// =============================================================================
// FINALIZE (mark build as ready / partial / failed)
// =============================================================================

function finalizeBuild_(sourceId, config) {
  var source = getSource_(sourceId);
  if (!source) {
    return;
  }

  var totalChars = getTotalUsableTextChars_(sourceId);
  var minChars = config.MIN_USABLE_WEBSITE_TEXT_CHARS;
  var failedPages = source.failed_pages || 0;
  var hadExistingChunks = countValidWebsiteChunks_(source.bot_id) > 0;

  var finalStatus = 'failed';
  var errorMessage = null;
  var refreshErrorMessage = null;

  if (totalChars >= minChars && failedPages === 0) {
    finalStatus = 'ready';
  } else if (totalChars >= minChars && failedPages > 0) {
    finalStatus = 'partial';
    refreshErrorMessage = failedPages + ' page(s) failed during processing.';
  } else if (totalChars < minChars && hadExistingChunks) {
    finalStatus = 'partial';
    refreshErrorMessage = 'Refresh did not produce enough usable website text. Previous knowledge was kept.';
    errorMessage = 'Not enough usable website text was extracted.';
  } else {
    finalStatus = 'failed';
    errorMessage = 'Not enough usable website text was extracted.';
  }

  if (finalStatus === 'ready' || (finalStatus === 'partial' && totalChars >= minChars)) {
    cleanupStaleWebsitePages_(sourceId, getSelectedNormalizedUrls_(source));
  }

  updateSource_(sourceId, {
    status: finalStatus,
    error_message: errorMessage,
    refresh_error_message: refreshErrorMessage,
    last_processed_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  logBuild_(
    sourceId,
    source.bot_id,
    'finalize',
    finalStatus,
    'Total text chars: ' + totalChars + ', failed pages: ' + failedPages +
      (errorMessage ? ' | ' + errorMessage : '') +
      (refreshErrorMessage ? ' | ' + refreshErrorMessage : '')
  );
}

/*
 * =============================================================================
 * SCRIPT PROPERTIES (Project Settings → Script properties)
 * =============================================================================
 *
 * Required:
 *   FIRECRAWL_API_KEY
 *   JINA_API_KEY
 *   OPENROUTER_API_KEY
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   GAS_INGESTION_HMAC_SECRET   (must match Next.js .env.local)
 *   WEB_APP_URL                 (your deployed web app URL)
 *
 * Optional:
 *   OPENROUTER_EMBEDDING_MODEL  (default: openai/text-embedding-3-small)
 *   OPENROUTER_PAGE_SELECT_MODEL (default: deepseek/deepseek-v4-flash)
 *   EMBEDDING_DIMENSIONS        (default: 1536)
 *   MIN_USABLE_WEBSITE_TEXT_CHARS (default: 300)
 *   GAS_STALE_PAGE_MINUTES      (default: 15)
 *   GAS_STUCK_SOURCE_MINUTES    (default: 45)
 *
 * Logging (optional):
 *   LOG_SHEET_ID                (Google Sheet ID — or run createLogSheet() once)
 *   LOG_SHEET_TAB               (default: Logs)
 */
