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
