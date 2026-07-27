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
