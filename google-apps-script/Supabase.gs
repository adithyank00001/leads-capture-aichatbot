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
