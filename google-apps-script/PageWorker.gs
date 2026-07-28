/**
 * Website RAG Page Worker (PageWorker.js) — processes one page per HTTP request.
 *
 * Deploy as web app → GAS_INGESTION_WEB_APP_URL
 * Actions: process_page, finalize (start/continue return 410)
 */

// =============================================================================
// CONFIG
// =============================================================================

function getConfig_() {
  var props = PropertiesService.getScriptProperties();
  return {
    JINA_API_KEY: props.getProperty('JINA_API_KEY') || '',
    OPENROUTER_API_KEY: props.getProperty('OPENROUTER_API_KEY') || '',
    SUPABASE_URL: (props.getProperty('SUPABASE_URL') || '').replace(/\/$/, ''),
    SUPABASE_SERVICE_ROLE_KEY: props.getProperty('SUPABASE_SERVICE_ROLE_KEY') || '',
    GAS_INGESTION_HMAC_SECRET: props.getProperty('GAS_INGESTION_HMAC_SECRET') || '',
    OPENROUTER_EMBEDDING_MODEL: props.getProperty('OPENROUTER_EMBEDDING_MODEL') || 'openai/text-embedding-3-small',
    EMBEDDING_DIMENSIONS: Number(props.getProperty('EMBEDDING_DIMENSIONS') || '1536'),
    MIN_USABLE_WEBSITE_TEXT_CHARS: Number(props.getProperty('MIN_USABLE_WEBSITE_TEXT_CHARS') || '300'),
    GAS_STALE_PAGE_MINUTES: Number(props.getProperty('GAS_STALE_PAGE_MINUTES') || '8'),
    LOG_SHEET_ID: props.getProperty('LOG_SHEET_ID') || '',
    LOG_SHEET_TAB: props.getProperty('LOG_SHEET_TAB') || 'Logs',
    OPENROUTER_PAGE_CLEANUP_MODEL: props.getProperty('OPENROUTER_PAGE_CLEANUP_MODEL') || 'deepseek/deepseek-v4-flash',
    OPENROUTER_PAGE_CLEANUP_FALLBACK_MODEL: props.getProperty('OPENROUTER_PAGE_CLEANUP_FALLBACK_MODEL') || 'google/gemini-2.5-flash-lite',
    OPENROUTER_PAGE_CLEANUP_MAX_INPUT_CHARS: Number(props.getProperty('OPENROUTER_PAGE_CLEANUP_MAX_INPUT_CHARS') || '12000')
  };
}

// =============================================================================
// LOGGING
// =============================================================================

var GAS_CODE_VERSION = '2026-07-28-v4-search-aliases';
var LOG_SHEET_HEADERS = ['Timestamp', 'Source ID', 'Bot ID', 'Step', 'Status', 'Message'];
var LOG_MESSAGE_MAX_LENGTH = 2000;

function createLogSheet() {
  var ss = SpreadsheetApp.create('Website RAG Page Worker Logs');
  var sheet = ss.getActiveSheet();
  sheet.setName('Logs');
  sheet.appendRow(LOG_SHEET_HEADERS);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, LOG_SHEET_HEADERS.length).setFontWeight('bold');
  PropertiesService.getScriptProperties().setProperty('LOG_SHEET_ID', ss.getId());
  PropertiesService.getScriptProperties().setProperty('LOG_SHEET_TAB', 'Logs');
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

function rpc_(name, params) {
  return supabaseRequest_('post', '/rest/v1/rpc/' + name, params || {});
}

function beginWebsitePageProcessing_(pageId) {
  return rpc_('begin_website_page_processing', { p_page_id: pageId });
}

function completeWebsitePage_(pageId, success, patch) {
  return rpc_('complete_website_page', {
    p_page_id: pageId,
    p_success: success,
    p_patch: patch || {}
  });
}

function tryFinalizeWebsiteSource_(sourceId, minChars, staleMinutes) {
  return rpc_('try_finalize_website_source', {
    p_source_id: sourceId,
    p_min_chars: minChars,
    p_stale_minutes: staleMinutes
  });
}

function replacePageChunks_(pageId, chunks) {
  return rpc_('replace_page_chunks', {
    p_page_id: pageId,
    p_chunks: chunks
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

    if (body.action === 'process_page') {
      return handleProcessPage_(body);
    }

    if (body.action === 'finalize') {
      return handleFinalize_(body);
    }

    if (body.action === 'start' || body.action === 'continue') {
      logBuild_(body.sourceId || '', body.botId || '', 'webhook', 'error', 'Deprecated action: ' + body.action);
      return jsonResponse_({ accepted: false, error: 'Deprecated action. Use master worker discover.' });
    }

    logBuild_(body.sourceId || '', body.botId || '', 'webhook', 'error', 'Unknown action: ' + body.action);
    return jsonResponse_({ accepted: false, error: 'Unknown action.' });
  } catch (err) {
    logErrorDetail_(body.sourceId || '', body.botId || '', 'webhook', err);
    return jsonResponse_({ accepted: false, error: String(err && err.message ? err.message : err) });
  }
}

function handleProcessPage_(body) {
  var pageId = body.pageId;
  var sourceId = body.sourceId;
  var botId = body.botId || '';

  if (!pageId || !sourceId) {
    logBuild_(sourceId || '', botId, 'process_page', 'error', 'Missing pageId or sourceId.');
    return jsonResponse_({ accepted: false, error: 'Missing pageId or sourceId.' });
  }

  var config = getConfig_();
  var beginResult;

  try {
    beginResult = beginWebsitePageProcessing_(pageId);
  } catch (err) {
    logErrorDetail_(sourceId, botId, 'begin_page', err);
    return jsonResponse_({ accepted: false, error: String(err && err.message ? err.message : err) });
  }

  if (!beginResult || !beginResult.started) {
    logBuild_(sourceId, botId, 'process_page', 'skipped', 'Page ' + pageId + ' not started (already claimed or wrong status).');
    return jsonResponse_({ accepted: true, skipped: true });
  }

  var page = beginResult.page;
  logBuild_(sourceId, botId, 'process_page', 'started', 'Processing: ' + page.page_url);

  try {
    var jina = fetchPageContentWithJina_(page.page_url, config);
    var content = String(jina.content || '').trim();

    if (content.length < 150) {
      throw new Error('Page content was too short (' + content.length + ' chars).');
    }

    var cleanedSections = cleanPageContentWithAi_(
      content,
      page.page_url,
      jina.title || page.page_title || '',
      config,
      sourceId,
      botId
    );
    var chunks = sectionsToChunks_(cleanedSections, page.page_url, jina.title || page.page_title || '');
    if (!chunks.length) {
      throw new Error('AI cleanup produced no usable chunks.');
    }

    var embeddedChunks = attachEmbeddingsToChunks_(chunks, config);
    replacePageChunks_(pageId, embeddedChunks);

    completeWebsitePage_(pageId, true, {
      page_title: jina.title || page.page_title || '',
      content_hash: hashContent_(content)
    });

    logBuild_(sourceId, botId, 'process_page', 'success', 'Completed: ' + page.page_url + ' (' + chunks.length + ' chunk(s))');
  } catch (err) {
    var errMsg = String(err && err.message ? err.message : err);
    logBuild_(sourceId, botId, 'process_page', 'error', 'Failed: ' + page.page_url + ' - ' + errMsg);
    try {
      completeWebsitePage_(pageId, false, { error_message: errMsg });
    } catch (completeErr) {
      logErrorDetail_(sourceId, botId, 'complete_page', completeErr);
    }
  }

  try {
    var finalizeResult = tryFinalizeWebsiteSource_(
      sourceId,
      config.MIN_USABLE_WEBSITE_TEXT_CHARS,
      config.GAS_STALE_PAGE_MINUTES
    );

    if (finalizeResult && finalizeResult.finalized) {
      logBuild_(sourceId, botId, 'finalize', finalizeResult.status || 'done',
        'Finalized. total_chars=' + (finalizeResult.total_chars || 0));
    } else if (finalizeResult && finalizeResult.reason) {
      logBuild_(sourceId, botId, 'finalize', 'step', 'Not finalized yet: ' + finalizeResult.reason);
    }
  } catch (finalizeErr) {
    logErrorDetail_(sourceId, botId, 'finalize', finalizeErr);
  }

  return jsonResponse_({ accepted: true, ok: true });
}

function handleFinalize_(body) {
  var sourceId = body.sourceId;
  var botId = body.botId || '';
  var config = getConfig_();

  if (!sourceId) {
    logBuild_('', botId, 'finalize', 'error', 'Missing sourceId on finalize request.');
    return jsonResponse_({ accepted: false, error: 'Missing sourceId.' });
  }

  logBuild_(sourceId, botId, 'finalize', 'started', 'Backup finalize triggered.');

  try {
    var result = tryFinalizeWebsiteSource_(
      sourceId,
      config.MIN_USABLE_WEBSITE_TEXT_CHARS,
      config.GAS_STALE_PAGE_MINUTES
    );

    if (result && result.finalized) {
      logBuild_(sourceId, botId, 'finalize', result.status || 'done',
        'Backup finalize complete. total_chars=' + (result.total_chars || 0));
    } else if (result && result.reason) {
      logBuild_(sourceId, botId, 'finalize', 'step', 'Backup finalize skipped: ' + result.reason);
    } else {
      logBuild_(sourceId, botId, 'finalize', 'error', 'Backup finalize returned no result.');
    }

    return jsonResponse_({ accepted: true, ok: true, result: result });
  } catch (err) {
    logErrorDetail_(sourceId, botId, 'finalize', err);
    return jsonResponse_({ accepted: false, error: String(err && err.message ? err.message : err) });
  }
}

// =============================================================================
// JINA
// =============================================================================

function fetchPageContentWithJina_(pageUrl, config) {
  var response = UrlFetchApp.fetch('https://r.jina.ai/' + encodeURI(pageUrl), {
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
    throw new Error('Jina fetch failed HTTP ' + status + ': ' + String(text || '').slice(0, 300));
  }

  var json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    return { title: '', content: text };
  }

  return {
    title: (json.data && json.data.title) || json.title || '',
    content: (json.data && json.data.content) || json.content || text
  };
}

// =============================================================================
// AI CONTENT CLEANUP
// =============================================================================

function truncateForAiCleanup_(text, maxChars) {
  var value = String(text || '').trim();
  if (!maxChars || value.length <= maxChars) {
    return value;
  }

  var headSize = Math.floor(maxChars * 0.7);
  var tailSize = maxChars - headSize - 40;
  return value.substring(0, headSize) + '\n\n[...content truncated...]\n\n' + value.substring(value.length - tailSize);
}

function buildAiCleanupPrompt_(rawContent, pageUrl, pageTitle) {
  return [
    'You are preparing scraped website text for a business chatbot knowledge base (RAG).',
    'Goal: keep text that helps the chatbot answer real customer questions. Remove text that does not help and would confuse search or answers.',
    '',
    'Remove (and why):',
    '- Site navigation and menus (not business facts; repeated on every page)',
    '- "Skip to content" and similar UI chrome',
    '- Image-only markdown lines with no useful text',
    '- Link-only blocks with almost no readable sentences',
    '- Repeated footer/header boilerplate such as menus, copyright text, and repeated link clutter',
    '- Empty or meaningless sections',
    '',
    'Do not remove useful information merely because it also appears in a footer or header.',
    'Preserve business facts such as address, phone, email, opening hours, and contact links even when they appear in footer/header areas.',
    '',
    'Do not invent or add facts that are not in the source. Only reorganize and clean what is already there.',
    'Use clear section headings that describe the content. Split into multiple sections when the page covers different topics.',
    '',
    'For each section, also return search_aliases: short phrases customers might use when asking about the SAME information in that section.',
    'search_aliases rules (very important):',
    '- Same meaning only. These are alternate wordings for the same topic/fact, not related ideas.',
    '- Do NOT add broader, narrower, or different-meaning terms.',
    '  BAD: content says "digital products" -> alias "software products" (not the same meaning).',
    '  BAD: content says "construction" -> alias "interior design" (different service).',
    '  GOOD: content has an address -> aliases like "location", "where are you located", "office address".',
    '  GOOD: content has a phone number -> aliases like "phone", "call", "contact number".',
    '  GOOD: heading "About Us" -> aliases like "who are you", "what do you do", "about the company".',
    '- Use only common everyday chat words real customers would type.',
    '- Do not add rare, technical, or fancy synonyms.',
    '- Do not repeat the heading or copy full sentences from content.',
    '- Return 3 to 10 aliases per section. Use [] when none apply.',
    '- search_aliases are for search matching only; keep content clean human-readable text with no bracket keyword lists.',
    '',
    'Return strict JSON only:',
    '{"sections":[{"heading":"...","content":"...","search_aliases":["...","..."]}]}',
    '',
    'Page URL: ' + pageUrl,
    'Page title: ' + (pageTitle || 'Unknown'),
    '',
    'Scraped markdown:',
    rawContent
  ].join('\n');
}

function parseJsonFromModel_(content) {
  if (!content) {
    return { sections: [] };
  }

  var trimmed = String(content).trim().replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(trimmed);
  } catch (e) {
    var match = trimmed.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error('AI cleanup returned invalid JSON.');
  }
}

function throwAiCleanupError_(message, retryable) {
  var err = new Error(message);
  err.retryable = retryable !== false;
  throw err;
}

function isHttpStatusRetryable_(status) {
  return status === 429 || status >= 500;
}

function callAiCleanupModelOnce_(rawContent, pageUrl, pageTitle, config, model) {
  if (!config.OPENROUTER_API_KEY) {
    throwAiCleanupError_('OPENROUTER_API_KEY is not configured.', false);
  }

  var prompt = buildAiCleanupPrompt_(rawContent, pageUrl, pageTitle);
  var response = UrlFetchApp.fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + config.OPENROUTER_API_KEY,
      'HTTP-Referer': pageUrl,
      'X-Title': 'Website RAG Page Cleanup'
    },
    payload: JSON.stringify({
      model: model,
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
    throwAiCleanupError_(
      'AI cleanup HTTP ' + status + ': ' + responseText.slice(0, 300),
      isHttpStatusRetryable_(status)
    );
  }

  var json;
  try {
    json = JSON.parse(responseText);
  } catch (parseErr) {
    throwAiCleanupError_('AI cleanup returned invalid response JSON: ' + responseText.slice(0, 300), true);
  }

  var content = json.choices && json.choices[0] && json.choices[0].message
    ? json.choices[0].message.content
    : '';

  if (!content) {
    throwAiCleanupError_('AI cleanup returned empty content: ' + responseText.slice(0, 300), true);
  }

  var parsed;
  try {
    parsed = parseJsonFromModel_(content);
  } catch (parseErr) {
    throwAiCleanupError_(String(parseErr && parseErr.message ? parseErr.message : parseErr), true);
  }

  if (!parsed || !parsed.sections || !parsed.sections.length) {
    throwAiCleanupError_('AI cleanup returned no sections.', true);
  }

  return parsed.sections;
}

function isMostlyLinks_(content) {
  var text = String(content || '');
  var compact = text.replace(/\s+/g, '');
  if (!compact) {
    return true;
  }

  var linkChars = 0;
  var linkPattern = /\]\([^)]+\)|https?:\/\/|www\./gi;
  var match;
  while ((match = linkPattern.exec(compact)) !== null) {
    linkChars += match[0].length;
  }

  return linkChars / compact.length > 0.7;
}

function filterAiSections_(sections) {
  var filtered = [];
  var seenHashes = {};

  (sections || []).forEach(function (section) {
    var heading = String(section && section.heading ? section.heading : '').trim();
    var content = String(section && section.content ? section.content : '').trim();

    if (!heading || !content || content.length < 40) {
      return;
    }

    if (isMostlyLinks_(content)) {
      return;
    }

    var contentHash = hashContent_(content);
    if (seenHashes[contentHash]) {
      return;
    }

    seenHashes[contentHash] = true;
    filtered.push({
      heading: heading,
      content: content,
      search_aliases: normalizeSearchAliases_(section.search_aliases, heading, content)
    });
  });

  return filtered;
}

function normalizeSearchAliases_(aliases, heading, content) {
  var values = [];

  if (Array.isArray(aliases)) {
    values = aliases;
  } else if (typeof aliases === 'string' && aliases.trim()) {
    values = aliases.split(',');
  }

  var seen = {};
  var normalized = [];
  var headingLower = String(heading || '').trim().toLowerCase();
  var contentLower = String(content || '').trim().toLowerCase();

  values.forEach(function (alias) {
    var trimmed = String(alias || '').trim();
    if (!trimmed || trimmed.length < 2 || trimmed.length > 80) {
      return;
    }

    var lower = trimmed.toLowerCase();
    if (lower === headingLower || seen[lower] || contentLower.indexOf(lower) >= 0) {
      return;
    }

    seen[lower] = true;
    normalized.push(trimmed);
  });

  return normalized.slice(0, 10);
}

function buildEmbeddingText_(heading, content, searchAliases) {
  var parts = [String(heading || '').trim(), String(content || '').trim()];

  if (searchAliases && searchAliases.length) {
    parts.push('Search terms: ' + searchAliases.join(', '));
  }

  return parts.filter(Boolean).join('\n');
}

function sectionsToChunks_(sections, pageUrl, pageTitle) {
  return (sections || []).map(function (section, index) {
    return {
      source_url: pageUrl,
      page_title: pageTitle || '',
      heading: section.heading,
      chunk_content: section.content,
      search_aliases: section.search_aliases || [],
      chunk_order: index
    };
  });
}

function cleanPageContentWithAi_(rawContent, pageUrl, pageTitle, config, sourceId, botId) {
  var models = [
    config.OPENROUTER_PAGE_CLEANUP_MODEL,
    config.OPENROUTER_PAGE_CLEANUP_FALLBACK_MODEL
  ].filter(function (model, index, list) {
    return model && list.indexOf(model) === index;
  });

  if (!models.length) {
    throw new Error('No AI cleanup models configured.');
  }

  var truncated = truncateForAiCleanup_(rawContent, config.OPENROUTER_PAGE_CLEANUP_MAX_INPUT_CHARS);
  var errors = [];

  for (var i = 0; i < models.length; i++) {
    var model = models[i];

    try {
      logBuild_(sourceId, botId, 'ai_cleanup', 'started',
        'model=' + model + ' input_chars=' + truncated.length);

      var rawSections = callAiCleanupModelOnce_(truncated, pageUrl, pageTitle, config, model);
      var filteredSections = filterAiSections_(rawSections);

      if (!filteredSections.length) {
        throwAiCleanupError_('All AI sections were filtered out.', true);
      }

      var aliasCount = filteredSections.reduce(function (total, section) {
        return total + ((section.search_aliases && section.search_aliases.length) || 0);
      }, 0);

      logBuild_(sourceId, botId, 'ai_cleanup', 'success',
        'model=' + model + ' raw_sections=' + rawSections.length + ' kept=' + filteredSections.length + ' aliases=' + aliasCount);

      return filteredSections;
    } catch (err) {
      var message = String(err && err.message ? err.message : err);
      var retryable = !(err && err.retryable === false);
      errors.push(model + ': ' + message);

      if (i < models.length - 1 && retryable) {
        logBuild_(sourceId, botId, 'ai_cleanup', 'retry',
          'Failed with ' + model + ': ' + message + ' | switching to ' + models[i + 1]);
        continue;
      }

      logBuild_(sourceId, botId, 'ai_cleanup', 'error', errors.join(' | '));
      throw new Error('AI cleanup failed: ' + errors.join(' | '));
    }
  }

  throw new Error('AI cleanup failed: ' + errors.join(' | '));
}

function hashContent_(text) {
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text);
  return digest.map(function (byte) {
    var hex = (byte < 0 ? byte + 256 : byte).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

// =============================================================================
// EMBEDDINGS
// =============================================================================

function embedTexts_(texts, config) {
  if (!texts.length) {
    return [];
  }

  var response = UrlFetchApp.fetch('https://openrouter.ai/api/v1/embeddings', {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + config.OPENROUTER_API_KEY },
    payload: JSON.stringify({
      model: config.OPENROUTER_EMBEDDING_MODEL,
      input: texts,
      dimensions: config.EMBEDDING_DIMENSIONS
    }),
    muteHttpExceptions: true
  });

  var status = response.getResponseCode();
  var responseText = response.getContentText() || '{}';
  if (status >= 400) {
    throw new Error('Embedding HTTP ' + status + ': ' + responseText.slice(0, 300));
  }

  var json;
  try {
    json = JSON.parse(responseText);
  } catch (parseErr) {
    throw new Error('Embedding provider returned invalid JSON: ' + responseText.slice(0, 300));
  }

  if (!json.data || !json.data.length) {
    throw new Error('Embedding provider returned no vectors: ' + responseText.slice(0, 300));
  }

  return json.data.map(function (item) {
    return '[' + item.embedding.join(',') + ']';
  });
}

function attachEmbeddingsToChunks_(chunks, config) {
  var vectors = embedTexts_(chunks.map(function (c) {
    return buildEmbeddingText_(c.heading, c.chunk_content, c.search_aliases);
  }), config);
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

/*
 * Script properties (page worker):
 *   JINA_API_KEY, OPENROUTER_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   GAS_INGESTION_HMAC_SECRET
 * Optional: OPENROUTER_EMBEDDING_MODEL, EMBEDDING_DIMENSIONS,
 *   MIN_USABLE_WEBSITE_TEXT_CHARS, GAS_STALE_PAGE_MINUTES, LOG_SHEET_ID,
 *   OPENROUTER_PAGE_CLEANUP_MODEL, OPENROUTER_PAGE_CLEANUP_FALLBACK_MODEL,
 *   OPENROUTER_PAGE_CLEANUP_MAX_INPUT_CHARS
 */
