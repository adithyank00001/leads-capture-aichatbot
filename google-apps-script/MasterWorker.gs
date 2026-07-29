/**
 * Website RAG Master Worker — discover pages + fan-out to page workers.
 *
 * Deploy as separate web app → GAS_MASTER_WEB_APP_URL
 * Script property GAS_PAGE_WORKER_URL = page worker web app URL
 */

// =============================================================================
// CONFIG
// =============================================================================

var RUN_DISCOVER_PROPERTY_PREFIX = 'RUN_DISCOVER_';
var FINALIZE_DELAY_MS = 8 * 60 * 1000;
var FIRECRAWL_MAP_MAX_ATTEMPTS = 3;
var MAX_SELECTED_WEBSITE_PAGES = 10;

function getConfig_() {
  var props = PropertiesService.getScriptProperties();
  return {
    FIRECRAWL_API_KEY: props.getProperty('FIRECRAWL_API_KEY') || '',
    OPENROUTER_API_KEY: props.getProperty('OPENROUTER_API_KEY') || '',
    SUPABASE_URL: (props.getProperty('SUPABASE_URL') || '').replace(/\/$/, ''),
    SUPABASE_SERVICE_ROLE_KEY: props.getProperty('SUPABASE_SERVICE_ROLE_KEY') || '',
    GAS_INGESTION_HMAC_SECRET: props.getProperty('GAS_INGESTION_HMAC_SECRET') || '',
    OPENROUTER_PAGE_SELECT_MODEL: props.getProperty('OPENROUTER_PAGE_SELECT_MODEL') || 'deepseek/deepseek-v4-flash',
    EMBEDDING_DIMENSIONS: Number(props.getProperty('EMBEDDING_DIMENSIONS') || '1536'),
    OPENROUTER_EMBEDDING_MODEL: props.getProperty('OPENROUTER_EMBEDDING_MODEL') || 'openai/text-embedding-3-small',
    GAS_PAGE_WORKER_URL: props.getProperty('GAS_PAGE_WORKER_URL') || '',
    MASTER_WEB_APP_URL: props.getProperty('MASTER_WEB_APP_URL') || ScriptApp.getService().getUrl(),
    LOG_SHEET_ID: props.getProperty('LOG_SHEET_ID') || '',
    LOG_SHEET_TAB: props.getProperty('LOG_SHEET_TAB') || 'Logs'
  };
}

// =============================================================================
// LOGGING
// =============================================================================

var GAS_CODE_VERSION = '2026-07-28-v3-page-select-prompt';
var LOG_SHEET_HEADERS = ['Timestamp', 'Source ID', 'Bot ID', 'Step', 'Status', 'Message'];
var LOG_MESSAGE_MAX_LENGTH = 2000;

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
      return;
    }
    var ss = SpreadsheetApp.openById(config.LOG_SHEET_ID);
    var sheet = ss.getSheetByName(config.LOG_SHEET_TAB) || ss.insertSheet(config.LOG_SHEET_TAB);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(LOG_SHEET_HEADERS);
      sheet.setFrozenRows(1);
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
  Logger.log('[' + step + '] ' + status + (message ? ': ' + message : ''));
  logToSheet_(sourceId, botId, step, status, message);
  logToSupabase_(sourceId, botId, step, status, message);
}

function logErrorDetail_(sourceId, botId, step, err) {
  var message = String(err && err.message ? err.message : err);
  var stack = err && err.stack ? String(err.stack) : '';
  logBuild_(sourceId, botId, step, 'error', message + (stack ? ' | stack: ' + stack : ''));
}

function getAuthFailureReason_(body) {
  var config = getConfig_();
  if (!config.GAS_INGESTION_HMAC_SECRET) {
    return 'HMAC secret is not configured in script properties.';
  }
  if (!body.sig) {
    return 'Missing signature (sig).';
  }
  if (!body.exp) {
    return 'Missing expiry (exp).';
  }
  if (Number(body.exp) < Math.floor(Date.now() / 1000)) {
    return 'Signature expired (exp in the past).';
  }
  return 'Signature mismatch (wrong secret or tampered payload).';
}

function summarizeHttpResponse_(response) {
  var status = response.getResponseCode();
  var text = String(response.getContentText() || '');
  var preview = text.replace(/\s+/g, ' ').trim();
  if (preview.length > 400) {
    preview = preview.substring(0, 400) + '...';
  }
  return {
    status: status,
    preview: preview,
    ok: status >= 200 && status < 300
  };
}

function logHttpResponse_(sourceId, botId, step, label, response) {
  var summary = summarizeHttpResponse_(response);
  if (!summary.ok) {
    logBuild_(sourceId, botId, step, 'error', label + ' HTTP ' + summary.status + ' | ' + summary.preview);
    return;
  }

  var parsed = null;
  try {
    parsed = JSON.parse(response.getContentText() || '{}');
  } catch (parseErr) {
    if (summary.preview.indexOf('<!DOCTYPE') !== -1 || summary.preview.indexOf('<html') !== -1) {
      logBuild_(sourceId, botId, step, 'error', label + ' returned HTML instead of JSON | ' + summary.preview);
      return;
    }
    logBuild_(sourceId, botId, step, 'error', label + ' returned non-JSON body | ' + summary.preview);
    return;
  }

  if (parsed && parsed.error && parsed.accepted === false) {
    logBuild_(sourceId, botId, step, 'error', label + ' rejected: ' + parsed.error);
    return;
  }

  logBuild_(sourceId, botId, step, 'http', label + ' HTTP ' + summary.status + ' | ' + summary.preview);
}

// =============================================================================
// AUTH
// =============================================================================

function buildCanonicalPayload_(body) {
  if (body.action === 'process_page') {
    return JSON.stringify({
      action: body.action,
      sourceId: body.sourceId,
      botId: body.botId,
      websiteUrl: body.websiteUrl,
      pageId: body.pageId,
      exp: body.exp
    });
  }

  return JSON.stringify({
    action: body.action,
    sourceId: body.sourceId,
    botId: body.botId,
    websiteUrl: body.websiteUrl,
    exp: body.exp
  });
}

function signPayload_(payload) {
  var config = getConfig_();
  var sig = Utilities.computeHmacSha256Signature(
    buildCanonicalPayload_(payload),
    config.GAS_INGESTION_HMAC_SECRET
  ).map(function (byte) {
    var hex = (byte < 0 ? byte + 256 : byte).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
  payload.sig = sig;
  return payload;
}

function signProcessPagePayload_(sourceId, botId, websiteUrl, pageId) {
  return signPayload_({
    action: 'process_page',
    sourceId: sourceId,
    botId: botId,
    websiteUrl: websiteUrl,
    pageId: pageId,
    exp: Math.floor(Date.now() / 1000) + 600
  });
}

function signFinalizePayload_(sourceId, botId, websiteUrl) {
  return signPayload_({
    action: 'finalize',
    sourceId: sourceId,
    botId: botId,
    websiteUrl: websiteUrl,
    exp: Math.floor(Date.now() / 1000) + 600
  });
}

function verifyRequestSignature_(body) {
  var config = getConfig_();
  if (!config.GAS_INGESTION_HMAC_SECRET || !body.sig || !body.exp) {
    return false;
  }
  if (Number(body.exp) < Math.floor(Date.now() / 1000)) {
    return false;
  }
  var expected = Utilities.computeHmacSha256Signature(
    buildCanonicalPayload_(body),
    config.GAS_INGESTION_HMAC_SECRET
  ).map(function (byte) {
    var hex = (byte < 0 ? byte + 256 : byte).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
  return expected === body.sig;
}

// =============================================================================
// SUPABASE
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
  if (response.getResponseCode() >= 400) {
    throw new Error('Supabase error ' + response.getResponseCode() + ': ' + text);
  }
  return text ? JSON.parse(text) : null;
}

function getSource_(sourceId) {
  var rows = supabaseRequest_('get', '/rest/v1/bot_website_sources?id=eq.' + encodeURIComponent(sourceId) + '&limit=1');
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

function listPagesForSource_(sourceId) {
  return supabaseRequest_(
    'get',
    '/rest/v1/bot_website_pages?source_id=eq.' + encodeURIComponent(sourceId) +
      '&select=id,page_url,sort_order,status&order=sort_order.asc',
    null
  ) || [];
}

// =============================================================================
// TRIGGERS
// =============================================================================

function scheduleDiscoverRun_(sourceId, botId, websiteUrl) {
  PropertiesService.getScriptProperties().setProperty(
    RUN_DISCOVER_PROPERTY_PREFIX + sourceId,
    JSON.stringify({ sourceId: sourceId, botId: botId, websiteUrl: websiteUrl })
  );
  ScriptApp.newTrigger('runDiscoverFromTrigger_')
    .timeBased()
    .after(1000)
    .create();
}

function runDiscoverFromTrigger_() {
  var props = PropertiesService.getScriptProperties().getProperties();
  Object.keys(props).forEach(function (key) {
    if (key.indexOf(RUN_DISCOVER_PROPERTY_PREFIX) !== 0) {
      return;
    }
    var payload;
    try {
      payload = JSON.parse(props[key]);
      PropertiesService.getScriptProperties().deleteProperty(key);
      runDiscoverAndFanout_(payload.sourceId, payload.botId, payload.websiteUrl);
    } catch (err) {
      logErrorDetail_(payload && payload.sourceId ? payload.sourceId : '', payload && payload.botId ? payload.botId : '', 'discover', err);
    }
  });
}

function scheduleBackupFinalize_(sourceId, botId, websiteUrl) {
  PropertiesService.getScriptProperties().setProperty(
    'FINALIZE_' + sourceId,
    JSON.stringify({ sourceId: sourceId, botId: botId, websiteUrl: websiteUrl })
  );
  ScriptApp.newTrigger('runBackupFinalizeFromTrigger_')
    .timeBased()
    .after(FINALIZE_DELAY_MS)
    .create();
}

function runBackupFinalizeFromTrigger_() {
  var props = PropertiesService.getScriptProperties().getProperties();
  Object.keys(props).forEach(function (key) {
    if (key.indexOf('FINALIZE_') !== 0) {
      return;
    }
    var payload;
    try {
      payload = JSON.parse(props[key]);
      PropertiesService.getScriptProperties().deleteProperty(key);
      postFinalizeToPageWorker_(payload.sourceId, payload.botId, payload.websiteUrl);
    } catch (err) {
      logErrorDetail_(payload && payload.sourceId ? payload.sourceId : '', payload && payload.botId ? payload.botId : '', 'finalize', err);
    }
  });
}

// =============================================================================
// MAIN ENTRY
// =============================================================================

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var body = {};
  try {
    if (!e || !e.postData || !e.postData.contents) {
      logBuild_('', '', 'webhook', 'error', 'Empty POST body received.');
      return jsonResponse_({ accepted: false, error: 'Empty POST body.' });
    }

    try {
      body = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      logErrorDetail_('', '', 'webhook', parseErr);
      return jsonResponse_({ accepted: false, error: 'Invalid JSON body.' });
    }

    logBuild_(body.sourceId || '', body.botId || '', 'webhook', 'received', 'action=' + body.action + ' CODE ' + GAS_CODE_VERSION);

    if (!verifyRequestSignature_(body)) {
      logBuild_(body.sourceId || '', body.botId || '', 'auth', 'error', getAuthFailureReason_(body));
      return jsonResponse_({ accepted: false, error: 'Invalid signature.' });
    }

    logBuild_(body.sourceId || '', body.botId || '', 'auth', 'passed', 'HMAC signature valid.');

    if (body.action === 'discover') {
      return handleDiscover_(body);
    }

    logBuild_(body.sourceId || '', body.botId || '', 'webhook', 'error', 'Unknown action: ' + body.action);
    return jsonResponse_({ accepted: false, error: 'Unknown action.' });
  } catch (err) {
    logErrorDetail_(body.sourceId || '', body.botId || '', 'webhook', err);
    return jsonResponse_({ accepted: false, error: String(err && err.message ? err.message : err) });
  }
}

function handleDiscover_(body) {
  var sourceId = body.sourceId;
  if (!sourceId) {
    logBuild_('', body.botId || '', 'discover', 'error', 'Missing sourceId on discover request.');
    return jsonResponse_({ accepted: false, error: 'Missing sourceId.' });
  }

  PropertiesService.getScriptProperties().setProperty(
    RUN_DISCOVER_PROPERTY_PREFIX + sourceId,
    JSON.stringify({
      sourceId: sourceId,
      botId: body.botId || '',
      websiteUrl: body.websiteUrl || ''
    })
  );

  logBuild_(sourceId, body.botId || '', 'discover', 'accepted', 'Discover started.');

  try {
    runDiscoverFromTrigger_();
  } catch (err) {
    logErrorDetail_(sourceId, body.botId || '', 'discover', err);
    return jsonResponse_({ accepted: false, error: String(err && err.message ? err.message : err) });
  }

  return jsonResponse_({ accepted: true, sourceId: sourceId });
}

function runDiscoverAndFanout_(sourceId, botId, websiteUrl) {
  var config = getConfig_();

  try {
    logBuild_(sourceId, botId, 'discover', 'started', 'Master discover started.');

    var source = getSource_(sourceId);
    if (!source) {
      throw new Error('Source not found: ' + sourceId);
    }

    runDiscoverPhase_(source, config);
    source = getSource_(sourceId);

    var pages = listPagesForSource_(sourceId);
    logBuild_(sourceId, botId, 'fanout', 'step', 'Fanning out ' + pages.length + ' page worker request(s).');

    fanOutProcessPages_(sourceId, botId, source.website_url, pages, config);
    scheduleBackupFinalize_(sourceId, botId, source.website_url);

    logBuild_(sourceId, botId, 'fanout', 'success', 'Fan-out complete. Backup finalize scheduled in 8 min.');
  } catch (err) {
    logErrorDetail_(sourceId, botId, 'discover', err);
    updateSource_(sourceId, {
      status: 'failed',
      error_message: String(err && err.message ? err.message : err),
      updated_at: new Date().toISOString()
    });
  }
}

function fanOutProcessPages_(sourceId, botId, websiteUrl, pages, config) {
  var workerUrl = config.GAS_PAGE_WORKER_URL;
  if (!workerUrl) {
    throw new Error('GAS_PAGE_WORKER_URL script property is not set.');
  }

  var requests = pages.map(function (page) {
    return {
      url: workerUrl,
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(signProcessPagePayload_(sourceId, botId, websiteUrl, page.id)),
      muteHttpExceptions: true
    };
  });

  if (!requests.length) {
    return;
  }

  var responses = UrlFetchApp.fetchAll(requests);
  responses.forEach(function (response, index) {
    logHttpResponse_(
      sourceId,
      botId,
      'fanout',
      'page ' + pages[index].page_url,
      response
    );
  });
}

function postFinalizeToPageWorker_(sourceId, botId, websiteUrl) {
  var config = getConfig_();
  var workerUrl = config.GAS_PAGE_WORKER_URL;
  if (!workerUrl) {
    logBuild_(sourceId, botId, 'finalize', 'error', 'GAS_PAGE_WORKER_URL not set.');
    return;
  }

  var response = UrlFetchApp.fetch(workerUrl, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(signFinalizePayload_(sourceId, botId, websiteUrl)),
    muteHttpExceptions: true
  });

  logHttpResponse_(sourceId, botId, 'finalize', 'Backup finalize to page worker', response);
}

// =============================================================================
// DISCOVER PHASE
// =============================================================================

function runDiscoverPhase_(source, config) {
  logBuild_(source.id, source.bot_id, 'discover', 'step', 'Raw input URL: ' + source.website_url);

  var websiteUrl = normalizeWebsiteUrl_(source.website_url);
  if (!websiteUrl) {
    throw new Error('Could not normalize website URL.');
  }

  var rawLinks = discoverLinksWithFirecrawl_(source.id, source.bot_id, websiteUrl, config);
  var discoveredUrls = filterDiscoveredUrls_(websiteUrl, rawLinks);
  logBuild_(source.id, source.bot_id, 'discover', 'step', 'Usable same-domain links: ' + discoveredUrls.length);

  if (!discoveredUrls.length) {
    discoveredUrls = [websiteUrl];
    logBuild_(source.id, source.bot_id, 'discover', 'warn', 'No links found. Using homepage only.');
  }

  var selectedUrls = selectPagesWithAi_(source.id, source.bot_id, websiteUrl, discoveredUrls, config);
  var websiteParts = parseUrlParts_(websiteUrl);
  if (!websiteParts) {
    throw new Error('Invalid website URL.');
  }

  var origin = websiteParts.origin;
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

  logBuild_(source.id, source.bot_id, 'discover', 'success', 'Selected ' + selectedUrls.length + ' page(s).');
}

// =============================================================================
// FIRECRAWL
// =============================================================================

function discoverLinksWithFirecrawl_(sourceId, botId, websiteUrl, config) {
  var attempt;
  var links = [];
  var lastError = '';

  for (attempt = 1; attempt <= FIRECRAWL_MAP_MAX_ATTEMPTS; attempt += 1) {
    logBuild_(sourceId, botId, 'firecrawl', 'step', 'Map attempt ' + attempt + '/' + FIRECRAWL_MAP_MAX_ATTEMPTS);
    var mapResult = fetchFirecrawlMapLinks_(sourceId, botId, websiteUrl, config);
    if (mapResult.links && mapResult.links.length) {
      logBuild_(sourceId, botId, 'firecrawl', 'success', 'Map found ' + mapResult.links.length + ' link(s) on attempt ' + attempt);
      return mapResult.links;
    }
    lastError = mapResult.error || 'No links returned';
    logBuild_(sourceId, botId, 'firecrawl', 'warn', 'Map attempt ' + attempt + ' failed: ' + lastError);
    if (attempt < FIRECRAWL_MAP_MAX_ATTEMPTS) {
      Utilities.sleep(2000);
    }
  }

  logBuild_(sourceId, botId, 'firecrawl', 'step', 'Map failed after ' + FIRECRAWL_MAP_MAX_ATTEMPTS + ' attempts. Trying scrape fallback.');
  var scrapeResult = fetchFirecrawlScrapeLinks_(sourceId, botId, websiteUrl, config);
  if (scrapeResult.links && scrapeResult.links.length) {
    logBuild_(sourceId, botId, 'firecrawl', 'success', 'Scrape fallback found ' + scrapeResult.links.length + ' link(s).');
    return scrapeResult.links;
  }

  logBuild_(sourceId, botId, 'firecrawl', 'error', 'Scrape fallback failed: ' + (scrapeResult.error || 'no links'));
  return [];
}

function fetchFirecrawlMapLinks_(sourceId, botId, websiteUrl, config) {
  try {
    var response = UrlFetchApp.fetch('https://api.firecrawl.dev/v1/map', {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + config.FIRECRAWL_API_KEY },
      payload: JSON.stringify({ url: websiteUrl, limit: 50 }),
      muteHttpExceptions: true
    });
    var status = response.getResponseCode();
    var bodyText = response.getContentText() || '{}';
    if (status >= 400) {
      return { links: [], error: 'HTTP ' + status + ' | ' + bodyText.slice(0, 300) };
    }
    var mapJson = JSON.parse(bodyText);
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
    var response = UrlFetchApp.fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + config.FIRECRAWL_API_KEY },
      payload: JSON.stringify({
        url: websiteUrl,
        formats: ['links'],
        onlyMainContent: false
      }),
      muteHttpExceptions: true
    });
    var status = response.getResponseCode();
    var bodyText = response.getContentText() || '{}';
    if (status >= 400) {
      return { links: [], error: 'HTTP ' + status + ' | ' + bodyText.slice(0, 300) };
    }
    var scrapeJson = JSON.parse(bodyText);
    var links = (scrapeJson.data && scrapeJson.data.links) || scrapeJson.links || [];
    return { links: dedupeUrls_(links) };
  } catch (e) {
    return { links: [], error: String(e.message || e) };
  }
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
// AI PAGE SELECTION
// =============================================================================

function selectPagesWithAi_(sourceId, botId, websiteUrl, discoveredUrls, config) {
  var prompt = [
    'You are helping choose the most useful public website pages for a business chatbot knowledge base.',
    'Homepage: ' + websiteUrl,
    'Choose up to ' + MAX_SELECTED_WEBSITE_PAGES + ' URLs from the discovered list only.',
    'Always include the homepage.',
    '',
    'WHAT TO INCLUDE (customer-facing, stable business information):',
    '- Pages that help answer: Who are you? What do you offer? How much does it cost? How do I contact you? Where are you? What work have you done?',
    '- About, services overview, contact, FAQ, portfolio/projects/case studies',
    '- Service or location landing pages (e.g. SEO services, digital marketing in Kochi, web development in Kerala)',
    '- Pages with durable facts: services, pricing hints, process, team, locations, phone, email, testimonials',
    '',
    'WHAT TO EXCLUDE (not useful for customer Q&A — never select these):',
    '- Blog index, blog posts, articles, news, press releases, insights, resources that are mainly editorial content',
    '- Careers, jobs, hiring, internships',
    '- Tag, category, archive, author, feed, sitemap, search result pages',
    '- Login, signup, cart, checkout, account, admin, legal-only pages unless they contain unique business facts',
    '- Any page that is mainly a list of links to other articles or dated posts',
    '- Any page whose main purpose is reading content over time, not learning about the business',
    '- Never select a URL whose main purpose is a blog, news section, or individual article/post',
    '',
    'DECISION RULE:',
    'Ask: "Would a customer asking about this business get a stable, useful answer from this page six months from now?"',
    '- If YES → include (e.g. services, contact, about, project showcase)',
    '- If NO → exclude (e.g. blog posts, news, job listings)',
    '',
    'If unsure between a blog/article page and a service/business page, prefer the service/business page.',
    'Do not select pages just to fill the quota. Fewer strong pages is better than weak ones.',
    '',
    'Return strict JSON only: {"selected_urls":["https://..."]}',
    'Discovered URLs:',
    JSON.stringify(discoveredUrls)
  ].join('\n');

  logBuild_(sourceId, botId, 'discover', 'step', 'Calling AI page selection (' + discoveredUrls.length + ' discovered URLs).');

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

  var status = response.getResponseCode();
  var responseText = response.getContentText() || '{}';
  if (status >= 400) {
    throw new Error('AI page selection HTTP ' + status + ': ' + responseText.slice(0, 300));
  }

  var json;
  try {
    json = JSON.parse(responseText);
  } catch (parseErr) {
    throw new Error('AI page selection returned invalid JSON: ' + responseText.slice(0, 300));
  }

  var content = json.choices && json.choices[0] && json.choices[0].message
    ? json.choices[0].message.content
    : '';

  if (!content) {
    throw new Error('AI page selection returned empty content: ' + responseText.slice(0, 300));
  }

  var parsed = parseJsonFromModel_(content);
  return validateSelectedUrls_(websiteUrl, parsed.selected_urls || [], discoveredUrls);
}

function parseJsonFromModel_(content) {
  if (!content) {
    return { selected_urls: [] };
  }
  var trimmed = String(content).trim().replace(/```json/gi, '').replace(/```/g, '').trim();
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
// URL HELPERS
// =============================================================================

function parseUrlParts_(rawUrl, baseOrigin) {
  var input = String(rawUrl || '').trim();
  if (!input) {
    return null;
  }
  if (input.indexOf('://') === -1 && baseOrigin) {
    input = String(baseOrigin).replace(/\/$/, '') + (input.charAt(0) === '/' ? input : '/' + input);
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
  if (!pathname) {
    pathname = '/';
  }
  return {
    href: protocol + '//' + host + pathname + search,
    origin: protocol + '//' + host,
    hostname: host.replace(/:\d+$/, ''),
    pathname: pathname,
    search: search
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
    return key.indexOf('utm_') !== 0 && key !== 'fbclid' && key !== 'gclid';
  });
  return parts.length ? '?' + parts.join('&') : '';
}

function normalizeWebsiteUrl_(input) {
  var parts = parseUrlParts_(String(input || '').trim());
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
    return host + path + stripTrackingParams_(parts.search);
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

/*
 * Script properties (master worker):
 *   FIRECRAWL_API_KEY, OPENROUTER_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   GAS_INGESTION_HMAC_SECRET, GAS_PAGE_WORKER_URL (page worker web app URL)
 * Optional: OPENROUTER_PAGE_SELECT_MODEL, OPENROUTER_EMBEDDING_MODEL, EMBEDDING_DIMENSIONS
 */
