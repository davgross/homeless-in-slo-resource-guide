/**
 * Markdown Parser - Parse markdown and extract directory entries
 */

import { marked } from 'marked';
import { createDirectoryLink } from './linkEnhancer.js';

/**
 * Configure marked with custom renderer to fix heading anchor issues
 */
const renderer = {
  heading({ tokens, depth }) {
    // Convert all tokens to HTML
    const text = this.parser.parseInline(tokens);

    // Wrap the entire content in a span to prevent flex/alignment issues
    // This ensures that anchor tags and text after them stay together
    return `<h${depth}><span>${text}</span></h${depth}>\n`;
  }
};

marked.use({ renderer });

/**
 * Extract directory entries from Directory.md content
 * Returns a Map of id -> { title, content, aliases }
 */
export function extractDirectoryEntries(directoryMarkdown) {
  const entries = new Map();

  // Split by h2 headings with anchors
  // Format: ## <a id="entry-id">Entry Name</a>
  // Note: Some headings have multiple anchor IDs, e.g.:
  //   ## <a id="id1">Name 1</a> / <a id="id2">Name 2</a>
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

    // Store position info for each anchor ID found
    if (anchorIds.length > 0) {
      // Use the first anchor's title as the primary title
      const primaryTitle = anchorIds[0].title;

      positions.push({
        ids: anchorIds,
        primaryTitle: primaryTitle,
        start: headerStart,
        headerEnd: headerEnd
      });
    }
  }

  // Extract content for each entry
  positions.forEach((pos, index) => {
    const nextPos = positions[index + 1];
    const maxEnd = nextPos ? nextPos.start : directoryMarkdown.length;

    // Get the raw content up to the next entry
    let rawContent = directoryMarkdown.slice(pos.headerEnd, maxEnd);

    // console.log(`Extracting entry: ${pos.ids.map(a => a.id).join(', ')}, title: ${pos.primaryTitle}`);
    // console.log(`  Raw content length: ${rawContent.length}, ends at: ${nextPos ? `next entry ${nextPos.ids[0].id}` : 'EOF'}`);

    // Stop at the first h2 header (##) that appears in the content
    // This catches redirect entries that don't have anchor IDs
    const h2Match = rawContent.match(/\n## /);
    let content = rawContent;
    if (h2Match) {
      // console.log(`  Found another h2 at position ${h2Match.index}, truncating content`);
      content = rawContent.slice(0, h2Match.index);
    }

    content = content.trim();

    // console.log(`  Final content length: ${content.length}`);
    // console.log(`  First 100 chars: ${content.substring(0, 100)}`);
    // console.log(`  Last 100 chars: ${content.substring(Math.max(0, content.length - 100))}`);

    // Extract aliases (alternative names) from content
    const aliases = extractAliases(content, pos.primaryTitle);

    // Create an entry for each anchor ID, all pointing to the same content
    pos.ids.forEach(anchor => {
      entries.set(anchor.id, {
        title: anchor.title,
        content: `## ${anchor.title}\n\n${content}`,
        aliases
      });
      // console.log(`  Created entry for ID: ${anchor.id} (${anchor.title})`);
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
 * Parse markdown and convert existing anchor links to directory modals
 */
export function parseMarkdown(markdown, directoryEntries) {
  // Convert markdown to HTML
  let html = marked.parse(markdown);

  // console.log('=== parseMarkdown ===');
  // console.log('Markdown length:', markdown.length);
  // console.log('HTML length:', html.length);

  // Show a sample of the HTML to see what links look like
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  const allLinks = tempDiv.querySelectorAll('a');
  // console.log('Total <a> tags found:', allLinks.length);

  // Show first 10 links
  // console.log('First 10 links:');
  // Array.from(allLinks).slice(0, 10).forEach((link, i) => {
  //   console.log(`  ${i + 1}. href="${link.getAttribute('href')}" text="${link.textContent.substring(0, 50)}"`);
  // });

  // Convert existing anchor links to directory modal links
  if (directoryEntries && directoryEntries.size > 0) {
    html = convertAnchorLinksToDirectoryLinks(html, directoryEntries);
  }

  return html;
}

/**
 * Convert existing anchor links (href="#id" or href="Directory.md#id") to directory modal links
 */
function convertAnchorLinksToDirectoryLinks(html, directoryEntries) {
  // console.log('convertAnchorLinksToDirectoryLinks called');
  // console.log('Directory entries count:', directoryEntries.size);
  // console.log('First 10 directory IDs:', Array.from(directoryEntries.keys()).slice(0, 10));

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  // Find all anchor links that point to directory entries
  // Match both "#id" and "Directory.md#id" formats
  const links = tempDiv.querySelectorAll('a[href*="#"]');
  // console.log('Found anchor links with href containing "#":', links.length);

  let convertedCount = 0;
  const brokenLinks = [];

  links.forEach(link => {
    const href = link.getAttribute('href');

    // Skip if this looks like a Resource Guide anchor link (not a Directory link)
    // Directory links contain "Directory.md" or start with "#" followed by a capitalized word
    const isDirectoryLink = href.includes('Directory.md') ||
                           (href.startsWith('#') && /^#[A-Z0-9]/.test(href));

    if (!isDirectoryLink) {
      return; // Skip Resource Guide internal links
    }

    // Extract the entry ID from the href
    // Handle both "#id" and "Directory.md#id" formats
    let entryId = null;
    if (href.includes('#')) {
      entryId = href.split('#')[1]; // Get everything after the first '#'
    }

    if (!entryId) {
      return; // Skip if we couldn't extract an ID
    }

    // console.log(`Checking link: href="${href}", entryId="${entryId}", text="${link.textContent.substring(0, 30)}"`);

    // Check if this is a directory entry (case-insensitive)
    // Try exact match first, then try case-insensitive
    let actualEntryId = null;
    if (directoryEntries.has(entryId)) {
      actualEntryId = entryId;
    } else {
      // Try case-insensitive match
      const lowerEntryId = entryId.toLowerCase();
      for (const [key] of directoryEntries) {
        if (key.toLowerCase() === lowerEntryId) {
          actualEntryId = key;
          // console.log(`  Found case-insensitive match: "${entryId}" → "${actualEntryId}"`);
          break;
        }
      }
    }

    if (actualEntryId) {
      // console.log(`  ✓ Converting to directory link`);
      // Convert to directory modal link
      // Keep href="#" so it remains focusable and clickable
      link.setAttribute('href', '#');
      link.setAttribute('data-directory-link', actualEntryId);
      link.setAttribute('aria-label', `View directory entry for ${link.textContent}`);
      convertedCount++;
    } else {
      // console.log(`  ✗ Not in directory`);
      // This is a broken directory link - collect it for warning
      brokenLinks.push({
        href: href,
        entryId: entryId,
        linkText: link.textContent.substring(0, 50)
      });
    }
  });

  // console.log(`Converted ${convertedCount} links to directory links`);

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

  return tempDiv.innerHTML;
}

// Removed automatic text-matching logic - we now rely on existing markdown links only
