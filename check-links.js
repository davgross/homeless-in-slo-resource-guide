#!/usr/bin/env node

/**
 * Check for broken internal links in markdown files
 * Finds links to anchors that don't exist
 */

const fs = require('fs');
const path = require('path');

// Files to check
const files = [
  'Resource guide.md',
  'Directory.md'
];

// Regex patterns
const anchorDefPattern = /<a\s+id=["']([^"']+)["']\s*\/?>/g;
const linkPattern = /\[([^\]]+)\]\(#([^)]+)\)/g;
const mdLinkPattern = /\[([^\]]+)\]\(([^)]+\.md)(?:#([^)]+))?\)/g;

function checkFile(filename) {
  console.log(`\n=== Checking ${filename} ===`);

  const content = fs.readFileSync(filename, 'utf-8');

  // Find all anchor definitions
  const anchors = new Set();
  let match;
  while ((match = anchorDefPattern.exec(content)) !== null) {
    anchors.add(match[1]);
  }

  console.log(`Found ${anchors.size} anchor definitions`);

  // Find all internal links
  const links = [];

  // Links within same file (#anchor)
  anchorDefPattern.lastIndex = 0;
  linkPattern.lastIndex = 0;
  while ((match = linkPattern.exec(content)) !== null) {
    links.push({
      text: match[1],
      anchor: match[2],
      file: filename,
      type: 'same-file'
    });
  }

  // Links to other markdown files
  mdLinkPattern.lastIndex = 0;
  while ((match = mdLinkPattern.exec(content)) !== null) {
    links.push({
      text: match[1],
      file: match[2],
      anchor: match[3],
      type: 'cross-file'
    });
  }

  console.log(`Found ${links.length} internal links`);

  // Check for broken links
  const broken = [];
  for (const link of links) {
    if (link.type === 'same-file') {
      if (!anchors.has(link.anchor)) {
        broken.push(link);
      }
    } else if (link.type === 'cross-file') {
      // Check if target file exists
      if (!fs.existsSync(link.file)) {
        broken.push({
          ...link,
          reason: 'File not found'
        });
      } else if (link.anchor) {
        // Check if anchor exists in target file
        const targetContent = fs.readFileSync(link.file, 'utf-8');
        const targetAnchors = new Set();
        let targetMatch;
        const targetAnchorPattern = /<a\s+id=["']([^"']+)["']\s*\/?>/g;
        while ((targetMatch = targetAnchorPattern.exec(targetContent)) !== null) {
          targetAnchors.add(targetMatch[1]);
        }
        if (!targetAnchors.has(link.anchor)) {
          broken.push({
            ...link,
            reason: 'Anchor not found in target file'
          });
        }
      }
    }
  }

  return { anchors, links, broken };
}

// Main
console.log('Checking for broken internal links...\n');

let totalBroken = 0;

for (const file of files) {
  if (!fs.existsSync(file)) {
    console.log(`\n⚠️  File not found: ${file}`);
    continue;
  }

  const result = checkFile(file);

  if (result.broken.length > 0) {
    console.log(`\n❌ Found ${result.broken.length} broken link(s):`);
    for (const link of result.broken) {
      if (link.type === 'same-file') {
        console.log(`  - [${link.text}](#${link.anchor}) -> anchor #${link.anchor} not found`);
      } else {
        console.log(`  - [${link.text}](${link.file}${link.anchor ? '#' + link.anchor : ''}) -> ${link.reason}`);
      }
    }
    totalBroken += result.broken.length;
  } else {
    console.log(`\n✓ All links OK`);
  }
}

console.log(`\n${'='.repeat(50)}`);
if (totalBroken > 0) {
  console.log(`Total broken links: ${totalBroken}`);
  process.exit(1);
} else {
  console.log('✓ All internal links are valid!');
  process.exit(0);
}
