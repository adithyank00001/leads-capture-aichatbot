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
    LOG_SHEET_TAB: props.getProperty('LOG_SHEET_TAB') || 'Logs'
  };
}

// =============================================================================
// LOGGING
// =============================================================================

var GAS_CODE_VERSION = '2026-07-28-v2-page-worker-logging';
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

    var chunks = chunkMarkdownContent_(content, page.page_url, jina.title || page.page_title || '');
    if (!chunks.length) {
      throw new Error('No chunks were created from page content.');
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
// CHUNKING
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
  var vectors = embedTexts_(chunks.map(function (c) { return c.chunk_content; }), config);
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
 *   MIN_USABLE_WEBSITE_TEXT_CHARS, GAS_STALE_PAGE_MINUTES, LOG_SHEET_ID
 */
