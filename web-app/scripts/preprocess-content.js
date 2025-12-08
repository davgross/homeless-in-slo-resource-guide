#!/usr/bin/env node

/**
 * Pre-process content at build time
 *
 * This script converts markdown to HTML and performs all processing
 * that would otherwise happen at runtime, significantly improving
 * initial page load performance.
 *
 * Outputs:
 * - public/processed/resources.html
 * - public/processed/directory.html
 * - public/processed/about.html
 * - public/processed/directory-entries.json
 * - public/processed/search-index.json
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';
import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Setup DOMPurify with jsdom
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// Paths
const ROOT_DIR = join(__dirname, '../..');
const WEB_APP_DIR = join(__dirname, '..');
const OUTPUT_DIR = join(WEB_APP_DIR, 'public', 'processed');

// Configure marked with custom renderer
const renderer = {
  heading({ tokens, depth }) {
    const text = this.parser.parseInline(tokens);
    return `<h${depth}><span>${text}</span></h${depth}>\n`;
  }
};
marked.use({ renderer });

console.log('🔄 Pre-processing content...\n');

// Ensure output directory exists
mkdirSync(OUTPUT_DIR, { recursive: true });

// Read source files
console.log('📖 Reading source files...');
const resourcesMarkdown = readFileSync(join(ROOT_DIR, 'Resource guide.md'), 'utf-8');
const directoryMarkdown = readFileSync(join(ROOT_DIR, 'Directory.md'), 'utf-8');
const aboutMarkdown = readFileSync(join(ROOT_DIR, 'About.md'), 'utf-8');

/**
 * Extract directory entries from Directory.md content
 * Returns a Map of id -> { title, content, aliases }
 */
function extractDirectoryEntries(directoryMarkdown) {
  const entries = new Map();
  const h2Regex = /^##\s+.*/gm;
  let match;
  const positions = [];

  // Find all h2 headings and extract all anchor IDs from each
  while ((match = h2Regex.exec(directoryMarkdown)) !== null) {
    const headerLine = match[0];
    const headerStart = match.index;
    const headerEnd = headerStart + headerLine.length;

    // Extract all <a id="...">...</a> tags from this heading
    const anchorRegex = /<a\s+id="([^"]+)"[^>]*>([^<]+)<\/a>/g;
    let anchorMatch;
    const anchorIds = [];

    while ((anchorMatch = anchorRegex.exec(headerLine)) !== null) {
      anchorIds.push({
        id: anchorMatch[1],
        title: anchorMatch[2].trim()
      });
    }

    if (anchorIds.length > 0) {
      positions.push({
        ids: anchorIds,
        primaryTitle: anchorIds[0].title,
        start: headerStart,
        headerEnd: headerEnd
      });
    }
  }

  // Extract content for each entry
  positions.forEach((pos, index) => {
    const nextPos = positions[index + 1];
    const maxEnd = nextPos ? nextPos.start : directoryMarkdown.length;

    let rawContent = directoryMarkdown.slice(pos.headerEnd, maxEnd);

    // Stop at the first h2 header (##) that appears in the content
    const h2Match = rawContent.match(/\n## /);
    let content = rawContent;
    if (h2Match) {
      content = rawContent.slice(0, h2Match.index);
    }

    content = content.trim();

    // Extract aliases
    const aliases = extractAliases(content, pos.primaryTitle);

    // Create an entry for each anchor ID
    pos.ids.forEach(anchor => {
      entries.set(anchor.id, {
        title: anchor.title,
        content: `## ${anchor.title}\n\n${content}`,
        aliases
      });
    });
  });

  return entries;
}

/**
 * Extract aliases (alternative names) for an entry
 */
function extractAliases(content, mainTitle) {
  const aliases = [mainTitle];

  // Look for "a.k.a." or "also known as"
  const akaRegex = /(?:a\.k\.a\.|also known as|formerly known as)\s*["""]?([^""".\n]+)["""]?/gi;
  let match;

  while ((match = akaRegex.exec(content)) !== null) {
    const alias = match[1].trim();
    if (alias && !aliases.includes(alias)) {
      aliases.push(alias);
    }
  }

  // Look for alternative format: > *See also [Name]*
  const seeAlsoRegex = />\s*\*See also \[([^\]]+)\]/gi;
  while ((match = seeAlsoRegex.exec(content)) !== null) {
    const alias = match[1].trim();
    if (alias && !aliases.includes(alias)) {
      aliases.push(alias);
    }
  }

  return aliases;
}

/**
 * Convert anchor links to directory modal links
 */
function convertAnchorLinksToDirectoryLinks(html, directoryEntries) {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  const links = document.querySelectorAll('a[href*="#"]');
  let convertedCount = 0;
  const brokenLinks = [];

  links.forEach(link => {
    const href = link.getAttribute('href');

    // Determine if this is a directory link
    const isDirectoryLink = href.includes('Directory.md') ||
                           (href.startsWith('#') && /^#[A-Z0-9]/.test(href));

    if (!isDirectoryLink) {
      return; // Skip Resource Guide internal links
    }

    // Extract the entry ID
    let entryId = null;
    if (href.includes('#')) {
      entryId = href.split('#')[1];
    }

    if (!entryId) {
      return;
    }

    // Check if this is a directory entry (case-insensitive)
    let actualEntryId = null;
    if (directoryEntries.has(entryId)) {
      actualEntryId = entryId;
    } else {
      const lowerEntryId = entryId.toLowerCase();
      for (const [key] of directoryEntries) {
        if (key.toLowerCase() === lowerEntryId) {
          actualEntryId = key;
          break;
        }
      }
    }

    if (actualEntryId) {
      link.setAttribute('href', '#');
      link.setAttribute('data-directory-link', actualEntryId);
      link.setAttribute('aria-label', `View directory entry for ${link.textContent}`);
      convertedCount++;
    } else {
      brokenLinks.push({
        href: href,
        entryId: entryId,
        linkText: link.textContent.substring(0, 50)
      });
    }
  });

  // Output warnings for broken directory links
  if (brokenLinks.length > 0) {
    console.warn('\n⚠️  BROKEN DIRECTORY LINKS FOUND:');
    console.warn(`Found ${brokenLinks.length} link(s) pointing to non-existent directory entries:\n`);
    brokenLinks.forEach(link => {
      console.warn(`  • Link text: "${link.linkText}"`);
      console.warn(`    Target ID: "${link.entryId}" (from href="${link.href}")`);
      console.warn(`    → This ID does not exist in Directory.md\n`);
    });
    console.warn('Please check Resource guide.md for typos in directory link IDs.\n');
  }

  return dom.serialize();
}

/**
 * Enhance phone links - add aria-labels and convert plain phone numbers
 */
function enhancePhoneLinks(document) {
  // Enhance existing tel: links
  const phoneLinks = document.querySelectorAll('a[href^="tel:"]');
  phoneLinks.forEach(link => {
    link.setAttribute('aria-label', `Call ${link.textContent.trim()}`);

    const href = link.getAttribute('href');
    if (!href.startsWith('tel:+1') && !href.includes(';ext')) {
      const cleanNumber = href.replace('tel:', '').replace(/\D/g, '');
      if (cleanNumber.length === 10) {
        link.setAttribute('href', `tel:+1-${cleanNumber}`);
      }
    }
  });

  // Convert plain phone numbers to links
  const phoneRegex = /\b\d{3}-\d{3}-\d{4}\b/g;

  function walkTextNodes(node, callback) {
    if (node.nodeType === 3) { // TEXT_NODE
      callback(node);
    } else {
      for (let child of Array.from(node.childNodes)) {
        walkTextNodes(child, callback);
      }
    }
  }

  function isInsideLink(node) {
    let current = node.parentNode;
    while (current) {
      if (current.tagName === 'A') {
        return true;
      }
      current = current.parentNode;
    }
    return false;
  }

  walkTextNodes(document.body, (textNode) => {
    const text = textNode.textContent;
    const matches = text.match(phoneRegex);

    if (matches && !isInsideLink(textNode)) {
      const parent = textNode.parentNode;
      const fragment = document.createDocumentFragment();
      let lastIndex = 0;

      text.replace(phoneRegex, (match, offset) => {
        if (offset > lastIndex) {
          fragment.appendChild(
            document.createTextNode(text.slice(lastIndex, offset))
          );
        }

        const link = document.createElement('a');
        const cleanNumber = match.replace(/\D/g, '');
        link.href = `tel:+1-${cleanNumber}`;
        link.textContent = match;
        link.setAttribute('aria-label', `Call ${match}`);
        fragment.appendChild(link);

        lastIndex = offset + match.length;
        return match;
      });

      if (lastIndex < text.length) {
        fragment.appendChild(
          document.createTextNode(text.slice(lastIndex))
        );
      }

      parent.replaceChild(fragment, textNode);
    }
  });
}

/**
 * Enhance email links
 */
function enhanceEmailLinks(document) {
  const emailLinks = document.querySelectorAll('a[href^="mailto:"]');
  emailLinks.forEach(link => {
    link.setAttribute('aria-label', `Email ${link.textContent.trim()}`);
  });
}

/**
 * Enhance external links - mark them (runtime will add target based on hostname)
 */
function markExternalLinks(document) {
  const links = document.querySelectorAll('a[href^="http"]');
  links.forEach(link => {
    // Add a data attribute to mark as external - runtime will check hostname
    link.setAttribute('data-external-link', 'true');
  });
}

/**
 * Enhance tables for mobile responsiveness
 */
function enhanceTables(document) {
  const tables = document.querySelectorAll('table');

  tables.forEach(table => {
    const headers = Array.from(table.querySelectorAll('thead th')).map(th =>
      th.textContent.trim()
    );

    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      cells.forEach((cell, index) => {
        if (headers[index]) {
          cell.setAttribute('data-label', headers[index]);
        }
      });
    });
  });
}

/**
 * Transform TOC into icon lozenges
 */
function transformTOCToLozenges(document) {
  const tocAnchor = document.querySelector('a[id="table-of-contents"]');
  if (!tocAnchor) return;

  const tocHeading = tocAnchor.closest('h2');
  if (!tocHeading) return;

  let currentElement = tocHeading.nextElementSibling;
  let tocList = null;

  while (currentElement) {
    if (currentElement.tagName === 'OL') {
      tocList = currentElement;
      break;
    }
    if (currentElement.tagName === 'H2') {
      break;
    }
    currentElement = currentElement.nextElementSibling;
  }

  if (!tocList) return;

  // Extract section links
  const links = Array.from(tocList.querySelectorAll('a[href^="#"]'));
  const sections = links.map(link => ({
    href: link.getAttribute('href'),
    text: link.textContent.trim()
  }));

  // Icon mapping - keys should match (case-insensitive) the actual TOC link text
  const iconMap = {
    'hotlines': '📞',
    'emergencies': '📞',
    'self-advocacy': '🗣️',
    'advocacy': '🗣️',
    'shelter': '🏠',
    'housing': '🏠',
    'property storage': '📦',
    'storage': '📦',
    'food': '🍎',
    'water': '💧',
    'transportation': '🚌',
    'clothing': '👕',
    'laundry': '🧺',
    'showers': '🚿',
    'hygiene': '🚿',
    'health': '⚕️',
    'medical': '⚕️',
    'drug': '🪷',
    'recovery': '🪷',
    'tattoo': '✨',
    'end-of-life': '🕊️',
    'safety': '🛡️',
    'legal': '⚖️',
    'ids': '🪪',
    'documents': '🪪',
    'mail': '📬',
    'banking': '💰',
    'money': '💰',
    'tax': '📋',
    'financial': '💵',
    'social security': '🏛️',
    'employment': '💼',
    'job': '💼',
    'education': '📚',
    'training': '📚',
    'phones': '📱',
    'internet': '💻',
    'email': '💻',
    'charging': '🔌',
    'children': '🚸',
    'youth': '🚸',
    'parents': '🚸',
    'peer support': '🤝🏽',
    'recreation': '🏓',
    'fitness': '🏓',
    'pet': '🐾',
    'disaster': '🌪️',
    'advocacy & organizing': '📢',
    'organizing': '📢',
    'free': '🎁',
    'guides': '📖',
    'directory': '📇'
  };

  // Create lozenges
  const wrapper = document.createElement('div');
  wrapper.className = 'toc-section-wrapper';
  wrapper.setAttribute('role', 'navigation');
  wrapper.setAttribute('aria-label', 'Table of contents with visual icons');

  const grid = document.createElement('div');
  grid.className = 'toc-lozenge-grid';  // Match CSS class name

  sections.forEach(section => {
    const lozenge = document.createElement('a');
    lozenge.href = section.href;
    lozenge.className = 'toc-lozenge';
    lozenge.setAttribute('aria-label', section.text);

    const lowerText = section.text.toLowerCase();
    let icon = '📄';
    for (const [key, value] of Object.entries(iconMap)) {
      if (lowerText.includes(key)) {
        icon = value;
        break;
      }
    }

    const iconSpan = document.createElement('span');
    iconSpan.className = 'toc-lozenge-icon';  // Match CSS class name
    iconSpan.setAttribute('aria-hidden', 'true');
    iconSpan.textContent = icon;

    const textSpan = document.createElement('span');
    textSpan.className = 'toc-lozenge-text';  // Match CSS class name
    textSpan.textContent = section.text;

    lozenge.appendChild(iconSpan);
    lozenge.appendChild(textSpan);
    grid.appendChild(lozenge);
  });

  // Add Directory link as the last item in TOC
  const directoryLozenge = document.createElement('a');
  directoryLozenge.href = '?section=directory';
  directoryLozenge.className = 'toc-lozenge';
  directoryLozenge.setAttribute('aria-label', 'Directory');

  const directoryIcon = document.createElement('span');
  directoryIcon.className = 'toc-lozenge-icon';
  directoryIcon.setAttribute('aria-hidden', 'true');
  directoryIcon.textContent = iconMap['directory'] || '📇';

  const directoryText = document.createElement('span');
  directoryText.className = 'toc-lozenge-text';
  directoryText.textContent = 'Directory';

  directoryLozenge.appendChild(directoryIcon);
  directoryLozenge.appendChild(directoryText);
  grid.appendChild(directoryLozenge);

  wrapper.appendChild(grid);
  tocList.parentNode.replaceChild(wrapper, tocList);
}

/**
 * Process markdown to fully enhanced HTML
 */
function processMarkdown(markdown, directoryEntries, options = {}) {
  console.log(`  Converting ${options.name || 'content'} to HTML...`);

  // Convert markdown to HTML
  let html = marked.parse(markdown);

  // Parse into DOM for manipulation
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // Convert directory links if entries provided
  if (directoryEntries && directoryEntries.size > 0) {
    console.log(`  Converting directory anchor links...`);
    html = convertAnchorLinksToDirectoryLinks(html, directoryEntries);
    // Re-parse after link conversion
    dom.window.document.body.innerHTML = html;
  }

  // Enhance phone links
  console.log(`  Enhancing phone links...`);
  enhancePhoneLinks(dom.window.document);

  // Enhance email links
  console.log(`  Enhancing email links...`);
  enhanceEmailLinks(dom.window.document);

  // Mark external links
  console.log(`  Marking external links...`);
  markExternalLinks(dom.window.document);

  // Enhance tables
  console.log(`  Enhancing tables...`);
  enhanceTables(dom.window.document);

  // Transform TOC if this is resources
  if (options.transformTOC) {
    console.log(`  Transforming TOC to lozenges...`);
    transformTOCToLozenges(dom.window.document);
  }

  // Get final HTML
  html = dom.window.document.body.innerHTML;

  // Sanitize HTML
  console.log(`  Sanitizing HTML...`);
  html = DOMPurify.sanitize(html, {
    ADD_ATTR: ['data-directory-link', 'data-lat', 'data-lon', 'data-zoom', 'data-label', 'data-bounds', 'data-external-link']
  });

  return html;
}

/**
 * Build search index from markdown content
 */
function buildSearchIndex(resourcesMarkdown, directoryEntries) {
  console.log('🔍 Building search index...');
  const searchIndex = [];

  // Normalize text for search
  function normalizeForSearch(text) {
    return text
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, '-')
      .toLowerCase();
  }

  // Index resource sections
  const sectionRegex = /^(#{1,3})\s*<a\s+id="([^"]+)"[^>]*>([^<]+)<\/a>/gm;
  let match;
  const sections = [];

  while ((match = sectionRegex.exec(resourcesMarkdown)) !== null) {
    const level = match[1].length;
    sections.push({
      level: level,
      id: match[2],
      title: match[3].trim(),
      start: match.index,
      headerEnd: match.index + match[0].length
    });
  }

  sections.forEach((section, index) => {
    let nextSameOrHigher = null;
    for (let i = index + 1; i < sections.length; i++) {
      if (sections[i].level <= section.level) {
        nextSameOrHigher = sections[i];
        break;
      }
    }

    const contentEnd = nextSameOrHigher ? nextSameOrHigher.start : resourcesMarkdown.length;
    const content = resourcesMarkdown.slice(section.headerEnd, contentEnd);

    // Convert to text
    const dom = new JSDOM(DOMPurify.sanitize(marked.parse(content)));
    const contentText = normalizeForSearch(dom.window.document.body.textContent);

    searchIndex.push({
      id: section.id,
      title: section.title,
      content: contentText,
      type: 'resource-section',
      level: section.level
    });
  });

  // Index directory entries
  directoryEntries.forEach((entry, id) => {
    const dom = new JSDOM(DOMPurify.sanitize(marked.parse(entry.content)));
    const contentText = normalizeForSearch(dom.window.document.body.textContent);

    searchIndex.push({
      id: id,
      title: entry.title,
      content: contentText,
      type: 'directory',
      aliases: entry.aliases
    });
  });

  console.log(`  Indexed ${searchIndex.length} items (${sections.length} sections + ${directoryEntries.size} directory entries)`);

  return searchIndex;
}

// Main processing
console.log('\n1️⃣  Extracting directory entries...');
const directoryEntries = extractDirectoryEntries(directoryMarkdown);
console.log(`  Found ${directoryEntries.size} directory entries`);

console.log('\n2️⃣  Processing Resources...');
const resourcesHTML = processMarkdown(resourcesMarkdown, directoryEntries, {
  name: 'Resources',
  transformTOC: true
});

console.log('\n3️⃣  Processing Directory...');
const directoryHTML = processMarkdown(directoryMarkdown, directoryEntries, {
  name: 'Directory'
});

console.log('\n4️⃣  Processing About...');
const aboutHTML = processMarkdown(aboutMarkdown, null, {
  name: 'About'
});

console.log('\n5️⃣  Building search index...');
const searchIndex = buildSearchIndex(resourcesMarkdown, directoryEntries);

// Convert directory entries Map to JSON-serializable format with HTML content
console.log('\n6️⃣  Preparing directory entries for export...');
const directoryEntriesObj = {};
directoryEntries.forEach((entry, id) => {
  // Convert entry content (markdown) to HTML
  const entryHTML = processMarkdown(entry.content, directoryEntries, { name: `Directory entry: ${entry.title}` });

  directoryEntriesObj[id] = {
    title: entry.title,
    content: entryHTML,  // Store as HTML, not markdown
    aliases: entry.aliases
  };
});

// Write output files
console.log('\n7️⃣  Writing output files...');
writeFileSync(join(OUTPUT_DIR, 'resources.html'), resourcesHTML, 'utf-8');
console.log('  ✅ resources.html');

writeFileSync(join(OUTPUT_DIR, 'directory.html'), directoryHTML, 'utf-8');
console.log('  ✅ directory.html');

writeFileSync(join(OUTPUT_DIR, 'about.html'), aboutHTML, 'utf-8');
console.log('  ✅ about.html');

writeFileSync(join(OUTPUT_DIR, 'directory-entries.json'), JSON.stringify(directoryEntriesObj, null, 2), 'utf-8');
console.log('  ✅ directory-entries.json');

writeFileSync(join(OUTPUT_DIR, 'search-index.json'), JSON.stringify(searchIndex, null, 2), 'utf-8');
console.log('  ✅ search-index.json');

console.log('\n✨ Pre-processing complete!\n');
