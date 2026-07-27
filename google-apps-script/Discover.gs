function normalizeWebsiteUrl_(input) {
  var trimmed = String(input || '').trim();
  if (!trimmed) {
    return '';
  }

  var withProtocol = trimmed.indexOf('://') === -1 ? 'https://' + trimmed : trimmed;
  var url = new URL(withProtocol);
  url.hash = '';
  var normalized = url.toString();
  if (normalized.endsWith('/') && url.pathname !== '/') {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
}

function normalizePageUrl_(url, baseOrigin) {
  try {
    var resolved = new URL(url, baseOrigin);
    resolved.hash = '';

    var keys = resolved.searchParams.keys ? Array.from(resolved.searchParams.keys()) : [];
    keys.forEach(function (key) {
      var lower = String(key).toLowerCase();
      if (lower.indexOf('utm_') === 0 || lower === 'fbclid' || lower === 'gclid') {
        resolved.searchParams.delete(key);
      }
    });

    if (resolved.pathname !== '/' && resolved.pathname.endsWith('/')) {
      resolved.pathname = resolved.pathname.slice(0, -1);
    }

    return resolved.toString();
  } catch (e) {
    return '';
  }
}

function getNormalizedPathKey_(url, baseOrigin) {
  try {
    var resolved = new URL(url, baseOrigin);
    var host = resolved.hostname.replace(/^www\./i, '').toLowerCase();
    var path = resolved.pathname === '/' ? '/' : resolved.pathname.replace(/\/$/, '');
    var search = resolved.search || '';
    return host + path + search;
  } catch (e) {
    return '';
  }
}

function isSameWebsiteDomain_(url, allowedHost) {
  try {
    var host = new URL(url).hostname.replace(/^www\./i, '').toLowerCase();
    var allowed = String(allowedHost || '').replace(/^www\./i, '').toLowerCase();
    return host === allowed || host.endsWith('.' + allowed);
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
  var origin = new URL(websiteUrl).origin;
  var allowedHost = new URL(websiteUrl).hostname;
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

function runDiscoverPhase_(source, config) {
  var websiteUrl = normalizeWebsiteUrl_(source.website_url);
  var rawLinks = discoverLinksWithFirecrawl_(websiteUrl, config);
  var discoveredUrls = filterDiscoveredUrls_(websiteUrl, rawLinks);

  if (!discoveredUrls.length) {
    discoveredUrls = [websiteUrl];
  }

  var selectedUrls = selectPagesWithAi_(websiteUrl, discoveredUrls, config);
  var origin = new URL(websiteUrl).origin;
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
