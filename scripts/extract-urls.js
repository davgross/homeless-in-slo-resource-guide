#!/usr/bin/env node

/**
 * Extract all external URLs from markdown files
 *
 * This script extracts:
 * - URLs from markdown links [text](url) (user-facing clickable links)
 * - Excludes: Source comments, tel:, sms:, mailto:, internal anchors (#), relative paths, map links
 *
 * Note: Source comment URLs are excluded as they're for verification only,
 * not user-facing links. A separate tool should verify source citations.
 *
 * Usage: node extract-urls.js [output-file]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Files to process (relative to parent directory)
const FILES_TO_PROCESS = [
  'Directory.md',
  'Directory_es.md',
  'Resource guide.md',
  'Resource guide_es.md',
  'About.md',
  'About_es.md'
];

// Regex patterns
const MARKDOWN_LINK_PATTERN = /\[([^\]]+)\]\(([^)]+)\)/g;
const HTTP_URL_PATTERN = /^https?:\/\//;

/**
 * Extract URLs from a single file
 */
function extractUrlsFromFile(filePath) {
  const urls = new Set();
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.basename(filePath);

  // Extract from markdown links (user-facing only, not Source comments)
  const lines = content.split('\n');
  lines.forEach((line, lineNum) => {
    let linkMatch;
    while ((linkMatch = MARKDOWN_LINK_PATTERN.exec(line)) !== null) {
      const url = linkMatch[2].trim();

      // Skip non-HTTP URLs and internal links
      if (!HTTP_URL_PATTERN.test(url)) {
        continue;
      }

      // Skip map links (they have coordinates, not real URLs)
      if (line.includes('class="map-link"')) {
        continue;
      }

      urls.add({
        url,
        source: fileName,
        type: 'markdown-link',
        line: lineNum + 1,
        context: line.trim().substring(0, 100)
      });
    }
  });

  return Array.from(urls);
}

/**
 * Extract all URLs from all files
 */
function extractAllUrls() {
  const allUrls = new Map(); // url -> [{source, type, line, context}]
  const baseDir = path.join(__dirname, '..');

  for (const file of FILES_TO_PROCESS) {
    const filePath = path.join(baseDir, file);

    if (!fs.existsSync(filePath)) {
      console.warn(`Warning: File not found: ${file}`);
      continue;
    }

    console.error(`Processing ${file}...`);
    const urls = extractUrlsFromFile(filePath);

    for (const urlData of urls) {
      const { url, source, type, line, context } = urlData;

      if (!allUrls.has(url)) {
        allUrls.set(url, []);
      }

      allUrls.get(url).push({ source, type, line, context });
    }
  }

  return allUrls;
}

/**
 * Format URLs for output
 */
function formatUrls(urlMap) {
  const urls = Array.from(urlMap.keys()).sort();
  const output = {
    metadata: {
      extractedAt: new Date().toISOString(),
      totalUrls: urls.length,
      files: FILES_TO_PROCESS
    },
    urls: urls.map(url => ({
      url,
      occurrences: urlMap.get(url)
    }))
  };

  return output;
}

/**
 * Main function
 */
function main() {
  const outputFile = process.argv[2] || path.join(__dirname, 'urls.json');

  console.error('Extracting URLs from markdown files...');
  const urlMap = extractAllUrls();

  console.error(`\nFound ${urlMap.size} unique URLs`);

  const output = formatUrls(urlMap);

  // Write to file
  fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
  console.error(`\nWritten to: ${outputFile}`);

  // Also print simple list to stdout for piping
  console.log(Array.from(urlMap.keys()).join('\n'));
}

main();
