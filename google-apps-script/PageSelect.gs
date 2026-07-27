var MAX_SELECTED_WEBSITE_PAGES = 11;

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
