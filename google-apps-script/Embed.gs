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
