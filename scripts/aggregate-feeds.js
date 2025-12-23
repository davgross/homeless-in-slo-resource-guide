#!/usr/bin/env node

/**
 * RSS Feed Aggregator and Filter
 *
 * Fetches multiple RSS feeds, filters by keywords (agency names),
 * and generates a combined RSS feed for Thunderbird.
 *
 * Usage:
 *   node aggregate-feeds.js [config-file] [output-file]
 *
 * Default config: scripts/feeds-config.json
 * Default output: ~/vivaslo-feed.xml
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseStringPromise } from 'xml2js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const DEFAULT_CONFIG = path.join(__dirname, 'feeds-config.json');
const DEFAULT_OUTPUT = path.join(process.env.HOME, 'vivaslo-feed.xml');
const MAX_ITEMS_PER_FEED = 50; // Limit items per feed to avoid huge files
const MAX_TOTAL_ITEMS = 200; // Max items in combined feed
const REQUEST_TIMEOUT = 15000; // 15 seconds

/**
 * Load configuration file
 */
function loadConfig(configFile) {
  try {
    const config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
    return config;
  } catch (error) {
    console.error(`Error loading config file ${configFile}:`, error.message);
    process.exit(1);
  }
}

/**
 * Extract keywords from Directory.md (agency names)
 */
function extractKeywordsFromDirectory() {
  const directoryPath = path.join(__dirname, '..', 'Directory.md');

  // Common words to exclude - these are too generic
  const STOP_WORDS = new Set([
    'the', 'and', 'for', 'inc', 'llc', 'of', 'in', 'at', 'to', 'a', 'an',
    'center', 'service', 'services', 'program', 'programs', 'community',
    'county', 'city', 'san', 'luis', 'obispo', 'slo', 'assistance',
    'support', 'coalition', 'network', 'foundation', 'organization',
    'clinic', 'health', 'care', 'project', 'initiative', 'agency'
  ]);

  try {
    const content = fs.readFileSync(directoryPath, 'utf-8');
    const keywords = new Set();

    // Match agency names from headers like: ## <a id="40-Prado">40 Prado Homeless Services Center</a>
    const headerPattern = /##\s*<a[^>]*>([^<]+)<\/a>/g;
    let match;

    while ((match = headerPattern.exec(content)) !== null) {
      const name = match[1].trim();

      // Only add full agency names, not individual words
      // This prevents generic words like "access", "action" from matching everything
      keywords.add(name);
    }

    return Array.from(keywords);
  } catch (error) {
    console.error('Error extracting keywords from Directory.md:', error.message);
    return [];
  }
}

/**
 * Fetch and parse an RSS feed
 */
async function fetchFeed(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'VivaSLO-RSS-Aggregator/1.0'
      }
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const xml = await response.text();
    const parsed = await parseStringPromise(xml);

    return parsed;
  } catch (error) {
    console.error(`  Error fetching ${url}: ${error.message}`);
    return null;
  }
}

/**
 * Extract items from parsed RSS feed (handles RSS 2.0 and Atom)
 */
function extractItems(parsed, feedUrl) {
  const items = [];

  try {
    // RSS 2.0 format
    if (parsed.rss && parsed.rss.channel && parsed.rss.channel[0].item) {
      for (const item of parsed.rss.channel[0].item) {
        items.push({
          title: item.title?.[0] || 'Untitled',
          link: item.link?.[0] || feedUrl,
          description: item.description?.[0] || '',
          pubDate: item.pubDate?.[0] || new Date().toUTCString(),
          guid: item.guid?.[0]?._ || item.guid?.[0] || item.link?.[0] || `${feedUrl}-${items.length}`,
          source: feedUrl
        });
      }
    }
    // Atom format
    else if (parsed.feed && parsed.feed.entry) {
      for (const entry of parsed.feed.entry) {
        const link = entry.link?.[0]?.$ ? entry.link[0].$.href : feedUrl;
        items.push({
          title: entry.title?.[0]?._ || entry.title?.[0] || 'Untitled',
          link: link,
          description: entry.summary?.[0]?._ || entry.summary?.[0] || entry.content?.[0]?._ || entry.content?.[0] || '',
          pubDate: entry.updated?.[0] || entry.published?.[0] || new Date().toUTCString(),
          guid: entry.id?.[0] || link || `${feedUrl}-${items.length}`,
          source: feedUrl
        });
      }
    }
  } catch (error) {
    console.error(`  Error extracting items from ${feedUrl}:`, error.message);
  }

  return items;
}

/**
 * Filter items by keywords (using whole-word matching)
 */
function filterItems(items, keywords) {
  if (!keywords || keywords.length === 0) {
    return items;
  }

  const keywordLower = keywords.map(k => k.toLowerCase());

  return items.filter(item => {
    const searchText = `${item.title} ${item.description}`.toLowerCase();

    return keywordLower.some(keyword => {
      // Use word boundary matching for better precision
      // This prevents "service" from matching "disservice", etc.
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return regex.test(searchText);
    });
  });
}

/**
 * Generate RSS 2.0 XML
 */
function generateRSS(items, config) {
  const now = new Date().toUTCString();

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n';
  xml += '  <channel>\n';
  xml += `    <title>${escapeXml(config.feedTitle || 'VivaSLO Resource Updates')}</title>\n`;
  xml += `    <link>${escapeXml(config.feedLink || 'https://vivaslo.org/')}</link>\n`;
  xml += `    <description>${escapeXml(config.feedDescription || 'Aggregated news about homeless resources in SLO County')}</description>\n`;
  xml += `    <lastBuildDate>${now}</lastBuildDate>\n`;
  xml += `    <generator>VivaSLO RSS Aggregator</generator>\n`;
  xml += '\n';

  // Sort by date (newest first)
  items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  // Add items
  for (const item of items.slice(0, MAX_TOTAL_ITEMS)) {
    xml += '    <item>\n';
    xml += `      <title>${escapeXml(item.title)}</title>\n`;
    xml += `      <link>${escapeXml(item.link)}</link>\n`;
    xml += `      <description>${escapeXml(item.description)}</description>\n`;
    xml += `      <pubDate>${escapeXml(item.pubDate)}</pubDate>\n`;
    xml += `      <guid isPermaLink="false">${escapeXml(item.guid)}</guid>\n`;
    xml += '    </item>\n';
  }

  xml += '  </channel>\n';
  xml += '</rss>\n';

  return xml;
}

/**
 * Escape XML special characters
 */
function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const configFile = args[0] || DEFAULT_CONFIG;
  const outputFile = args[1] || DEFAULT_OUTPUT;

  console.log('VivaSLO RSS Feed Aggregator');
  console.log('===========================\n');

  // Load configuration
  console.log(`Loading configuration from: ${configFile}`);
  const config = loadConfig(configFile);

  // Extract keywords from Directory if enabled
  let keywords = config.keywords || [];
  if (config.autoExtractKeywords !== false) {
    console.log('Extracting agency names from Directory.md...');
    const autoKeywords = extractKeywordsFromDirectory();
    console.log(`  Found ${autoKeywords.length} agency names`);
    keywords = [...new Set([...keywords, ...autoKeywords])];
  }

  console.log(`\nFiltering by ${keywords.length} keywords`);

  // Fetch all feeds
  console.log(`\nFetching ${config.feeds.length} feeds...`);
  const allItems = [];

  for (const feedConfig of config.feeds) {
    const url = feedConfig.url || feedConfig;
    const feedName = feedConfig.name || url;

    console.log(`  Fetching: ${feedName}`);
    const parsed = await fetchFeed(url);

    if (parsed) {
      const items = extractItems(parsed, url);
      console.log(`    Found ${items.length} items`);

      // Limit items per feed
      const limitedItems = items.slice(0, MAX_ITEMS_PER_FEED);
      allItems.push(...limitedItems);
    }

    // Small delay between feeds
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\nTotal items fetched: ${allItems.length}`);

  // Filter by keywords
  const filteredItems = filterItems(allItems, keywords);
  console.log(`Filtered items: ${filteredItems.length}`);

  // Generate RSS XML
  console.log(`\nGenerating RSS feed...`);
  const rssXml = generateRSS(filteredItems, config);

  // Write to file
  fs.writeFileSync(outputFile, rssXml, 'utf-8');
  console.log(`✓ RSS feed written to: ${outputFile}`);
  console.log(`\nTo subscribe in Thunderbird:`);
  console.log(`  File → New → Feed Account`);
  console.log(`  Add feed URL: file://${outputFile}`);
  console.log(`\nTo update the feed, run this script again (or set up a cron job)`);
}

main();
