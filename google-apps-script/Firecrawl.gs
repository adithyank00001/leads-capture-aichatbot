var FIRECRAWL_MAP_MAX_ATTEMPTS = 3;

function discoverLinksWithFirecrawl_(websiteUrl, config) {
  var attempt;
  var links = [];

  for (attempt = 1; attempt <= FIRECRAWL_MAP_MAX_ATTEMPTS; attempt += 1) {
    var mapResult = fetchFirecrawlMapLinks_(websiteUrl, config);
    if (mapResult.links && mapResult.links.length) {
      return mapResult.links;
    }

    if (attempt < FIRECRAWL_MAP_MAX_ATTEMPTS) {
      Utilities.sleep(2000);
    }
  }

  var scrapeResult = fetchFirecrawlScrapeLinks_(websiteUrl, config);
  return scrapeResult.links || [];
}

function fetchFirecrawlMapLinks_(websiteUrl, config) {
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
    if (mapStatus < 200 || mapStatus >= 300) {
      return { links: [], error: 'HTTP ' + mapStatus };
    }

    var mapJson = JSON.parse(mapResponse.getContentText() || '{}');
    if (mapJson.success === false) {
      return { links: [], error: mapJson.error || 'map success=false' };
    }

    var mapLinks = mapJson.links || (mapJson.data && mapJson.data.links) || [];
    return { links: dedupeUrls_(mapLinks) };
  } catch (e) {
    return { links: [], error: String(e.message || e) };
  }
}

function fetchFirecrawlScrapeLinks_(websiteUrl, config) {
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
    if (scrapeStatus < 200 || scrapeStatus >= 300) {
      return { links: [], error: 'HTTP ' + scrapeStatus };
    }

    var scrapeJson = JSON.parse(scrapeResponse.getContentText() || '{}');
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
