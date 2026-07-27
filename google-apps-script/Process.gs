var MAX_RUN_MS = 4.5 * 60 * 1000;

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

  scheduleContinue_(source.id);
}

function processSinglePage_(source, page, config) {
  var attempts = 0;
  var lastError = null;

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
}
