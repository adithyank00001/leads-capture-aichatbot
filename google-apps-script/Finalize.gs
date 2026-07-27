function finalizeBuild_(sourceId, config) {
  var source = getSource_(sourceId);
  if (!source) {
    return;
  }

  var totalChars = getTotalUsableTextChars_(sourceId);
  var minChars = config.MIN_USABLE_WEBSITE_TEXT_CHARS;
  var failedPages = source.failed_pages || 0;
  var hadExistingChunks = countValidWebsiteChunks_(source.bot_id) > 0;

  var finalStatus = 'failed';
  var errorMessage = null;
  var refreshErrorMessage = null;

  if (totalChars >= minChars && failedPages === 0) {
    finalStatus = 'ready';
  } else if (totalChars >= minChars && failedPages > 0) {
    finalStatus = 'partial';
    refreshErrorMessage = failedPages + ' page(s) failed during processing.';
  } else if (totalChars < minChars && hadExistingChunks) {
    finalStatus = 'partial';
    refreshErrorMessage = 'Refresh did not produce enough usable website text. Previous knowledge was kept.';
    errorMessage = 'Not enough usable website text was extracted.';
  } else {
    finalStatus = 'failed';
    errorMessage = 'Not enough usable website text was extracted.';
  }

  if (finalStatus === 'ready' || (finalStatus === 'partial' && totalChars >= minChars)) {
    cleanupStaleWebsitePages_(sourceId, getSelectedNormalizedUrls_(source));
  }

  updateSource_(sourceId, {
    status: finalStatus,
    error_message: errorMessage,
    refresh_error_message: refreshErrorMessage,
    last_processed_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
}
