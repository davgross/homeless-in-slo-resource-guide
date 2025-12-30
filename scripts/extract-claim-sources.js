#!/usr/bin/env node

/**
 * Extract claim-source pairs from markdown source annotations
 *
 * This script finds all `<!-- Source: URL -->` annotations in markdown files
 * and extracts the specific claim/data that each source supports, along with
 * surrounding context for smart change detection.
 *
 * Output: claim-sources.json containing ~1,800 claim-source pairs with:
 * - Claim text (phone number, hours, address, etc.)
 * - Claim type classification (for fuzzy matching)
 * - Source URL
 * - Context (for finding the claim on the source page)
 * - Priority (for batch scheduling)
 *
 * Usage: node extract-claim-sources.js [output-file]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Files to process (relative to parent directory)
const FILES_TO_PROCESS = [
  'Directory.md',
  'Resource guide.md'
];

// Regex patterns for source annotations
const SOURCE_PATTERN = /<!--\s*Source:\s*([^>]+?)\s*-->/;

// Regex patterns for claim type detection
const PATTERNS = {
  phone: /\b(\d{3}[-.\s]?\d{3}[-.\s]?\d{4}|\(\d{3}\)\s*\d{3}[-.\s]?\d{4}|\d{3})\b/,
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
  hours: /\b(\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.)|\d{1,2}(?::\d{2})?\s*[-–]\s*\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.)|(?:mon|tue|wed|thu|fri|sat|sun|monday|tuesday|wednesday|thursday|friday|saturday|sunday))/i,
  address: /\b\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:St\.?|Street|Ave\.?|Avenue|Rd\.?|Road|Blvd\.?|Boulevard|Dr\.?|Drive|Ln\.?|Lane|Ct\.?|Court)\b/i,
  url: /https?:\/\/[^\s)]+/,
  money: /\$\d+(?:[-–]\d+)?/
};

/**
 * Classify claim type based on content
 */
function classifyClaimType(text) {
  if (PATTERNS.phone.test(text)) return 'phone';
  if (PATTERNS.email.test(text)) return 'email';
  if (PATTERNS.hours.test(text)) return 'hours';
  if (PATTERNS.address.test(text)) return 'address';
  if (PATTERNS.url.test(text)) return 'url';
  if (PATTERNS.money.test(text)) return 'money';
  return 'general';
}

/**
 * Extract the core searchable element from claim text
 * This identifies the key piece of information that should appear on the source page
 */
function extractSearchableCore(text, claimType) {
  let core = text;

  switch (claimType) {
    case 'phone':
      // Extract just the phone number, including extension
      const phoneMatch = text.match(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}(?:\s*(?:x|ext\.?|extension)\s*\d+)?|\(\d{3}\)\s*\d{3}[-.\s]?\d{4}(?:\s*(?:x|ext\.?|extension)\s*\d+)?|\d{3}(?:\s*(?:x|ext\.?|extension)\s*\d+)?/i);
      if (phoneMatch) {
        core = phoneMatch[0];
      }
      break;

    case 'email':
      // Extract just the email address
      const emailMatch = text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}/);
      if (emailMatch) {
        core = emailMatch[0];
      }
      break;

    case 'hours':
      // Extract time ranges and days, remove extra description
      // Keep patterns like "M–F 9am–5pm" or "9am–5pm" or "before 9am"
      const hoursMatch = text.match(/(?:(?:mon|tue|wed|thu|fri|sat|sun|monday|tuesday|wednesday|thursday|friday|saturday|sunday|m|t|w|th|f|sa|su)[-–]?)+\s*\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.)[-–]\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.)|(?:before|after|until)\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)|daily,?\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)[-–]\d{1,2}(?::\d{2})?\s*(?:am|pm)|\d{1,2}(?::\d{2})?\s*(?:am|pm)[-–]\d{1,2}(?::\d{2})?\s*(?:am|pm)/i);
      if (hoursMatch) {
        core = hoursMatch[0];
      }
      break;

    case 'address':
      // Keep the full address but remove extra description
      const addressMatch = text.match(/\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:St\.?|Street|Ave\.?|Avenue|Rd\.?|Road|Blvd\.?|Boulevard|Dr\.?|Drive|Ln\.?|Lane|Ct\.?|Court)(?:,?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)?/i);
      if (addressMatch) {
        core = addressMatch[0];
      }
      break;

    case 'url':
      // Extract just the URL
      const urlMatch = text.match(/https?:\/\/[^\s)]+/);
      if (urlMatch) {
        core = urlMatch[0];
      }
      break;

    case 'money':
      // Extract just the money amount
      const moneyMatch = text.match(/\$\d+(?:[-–]\d+)?/);
      if (moneyMatch) {
        core = moneyMatch[0];
      }
      break;

    case 'general':
      // For general claims, remove parenthetical remarks and extra notes
      core = text.replace(/\([^)]+\)/g, '').trim();
      // If it's very long, try to extract a key phrase
      if (core.length > 100) {
        // Take first sentence or phrase up to first period/comma
        const firstPhrase = core.match(/^[^.,;]+/);
        if (firstPhrase) {
          core = firstPhrase[0];
        }
      }
      break;
  }

  return core.trim();
}

/**
 * Assign priority based on claim type
 */
function assignPriority(claimType) {
  const highPriority = ['phone', 'email', 'address', 'hours'];
  const normalPriority = ['url', 'money'];

  if (highPriority.includes(claimType)) return 'high';
  if (normalPriority.includes(claimType)) return 'normal';
  return 'low';
}

/**
 * Strip HTML/markdown formatting to get clean claim text
 */
function stripFormatting(text) {
  // Remove HTML tags
  let cleaned = text.replace(/<[^>]+>/g, ' ');

  // Remove markdown link formatting [text](url)
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Remove markdown bold/italic
  cleaned = cleaned.replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, '$1');

  // Remove list markers (-, *, numbers)
  cleaned = cleaned.replace(/^[-*•]\s+/, '');
  cleaned = cleaned.replace(/^\d+\.\s+/, '');

  // Remove common prefixes like field labels
  cleaned = cleaned.replace(/^(Phone|Email|Hours|Location|Website|Address):\s*/i, '');

  // Collapse whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

/**
 * Extract claim from line(s) before source annotation
 */
function extractClaim(lines, sourceLineNum) {
  const sourceLine = lines[sourceLineNum];

  // Extract claim from the same line (most common case)
  const lineBeforeSource = sourceLine.split('<!--')[0].trim();
  if (lineBeforeSource.length > 5) {
    return {
      claimText: stripFormatting(lineBeforeSource),
      rawClaimText: lineBeforeSource,
      claimStartLine: sourceLineNum,
      claimEndLine: sourceLineNum
    };
  }

  // Check previous line
  if (sourceLineNum > 0) {
    const prevLine = lines[sourceLineNum - 1].trim();
    if (prevLine.length > 5 && !prevLine.includes('<!--')) {
      return {
        claimText: stripFormatting(prevLine),
        rawClaimText: prevLine,
        claimStartLine: sourceLineNum - 1,
        claimEndLine: sourceLineNum - 1
      };
    }
  }

  // Check 2 lines before (for multi-line entries)
  if (sourceLineNum > 1) {
    const lines2back = lines[sourceLineNum - 2].trim();
    const lines1back = lines[sourceLineNum - 1].trim();
    const combined = lines2back + ' ' + lines1back;
    if (combined.length > 5) {
      return {
        claimText: stripFormatting(combined),
        rawClaimText: combined,
        claimStartLine: sourceLineNum - 2,
        claimEndLine: sourceLineNum - 1
      };
    }
  }

  // Fallback: use what we have
  return {
    claimText: stripFormatting(lineBeforeSource || ''),
    rawClaimText: lineBeforeSource || '',
    claimStartLine: sourceLineNum,
    claimEndLine: sourceLineNum
  };
}

/**
 * Extract context around claim for matching on source pages
 */
function extractContext(lines, claimStartLine, claimEndLine, contextChars = 200) {
  const beforeLines = [];
  const afterLines = [];

  // Get lines before claim
  let charCount = 0;
  for (let i = claimStartLine - 1; i >= 0 && charCount < contextChars; i--) {
    const line = lines[i];
    if (!line.trim().startsWith('##') && !line.trim().startsWith('#')) {
      beforeLines.unshift(line);
      charCount += line.length;
    } else {
      break; // Stop at section headers
    }
  }

  // Get lines after claim
  charCount = 0;
  for (let i = claimEndLine + 1; i < lines.length && charCount < contextChars; i++) {
    const line = lines[i];
    if (!line.trim().startsWith('##') && !line.trim().startsWith('#') && !line.includes('<!-- Source:')) {
      afterLines.push(line);
      charCount += line.length;
    } else {
      break; // Stop at section headers or next source
    }
  }

  return {
    contextBefore: stripFormatting(beforeLines.join(' ')).substring(0, contextChars),
    contextAfter: stripFormatting(afterLines.join(' ')).substring(0, contextChars)
  };
}

/**
 * Extract claim-source pairs from a single file
 */
function extractClaimSourcesFromFile(filePath) {
  const claims = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.basename(filePath);
  const lines = content.split('\n');

  lines.forEach((line, lineNum) => {
    const sourceMatch = SOURCE_PATTERN.exec(line);

    if (sourceMatch) {
      const sourceUrl = sourceMatch[1].trim();

      // Extract the claim this source supports
      const claim = extractClaim(lines, lineNum);

      // Skip if we couldn't extract meaningful claim text
      if (claim.claimText.length < 3) {
        console.warn(`Warning: Could not extract claim for source at ${fileName}:${lineNum + 1}`);
        return;
      }

      // Classify claim type
      const claimType = classifyClaimType(claim.claimText);

      // Extract searchable core - the key element to look for on source pages
      const searchableCore = extractSearchableCore(claim.claimText, claimType);

      // Extract surrounding context
      const context = extractContext(lines, claim.claimStartLine, claim.claimEndLine);

      // Determine priority
      const priority = assignPriority(claimType);

      // Create unique ID
      const fileShort = fileName.replace('.md', '').replace(' ', '-').toLowerCase();
      const id = `${fileShort}:${lineNum + 1}`;

      claims.push({
        id,
        file: fileName,
        line: lineNum + 1,
        sourceUrl,
        claimType,
        claimText: claim.claimText,
        searchableCore,  // The key element to search for
        rawClaimText: claim.rawClaimText,
        contextBefore: context.contextBefore,
        contextAfter: context.contextAfter,
        priority
      });
    }
  });

  return claims;
}

/**
 * Extract all claim-source pairs from all files
 */
function extractAllClaimSources() {
  const allClaims = [];
  const baseDir = path.join(__dirname, '..');

  for (const file of FILES_TO_PROCESS) {
    const filePath = path.join(baseDir, file);

    if (!fs.existsSync(filePath)) {
      console.warn(`Warning: File not found: ${file}`);
      continue;
    }

    console.error(`Processing ${file}...`);
    const claims = extractClaimSourcesFromFile(filePath);
    console.error(`  Found ${claims.length} claim-source pairs`);

    allClaims.push(...claims);
  }

  return allClaims;
}

/**
 * Format output with metadata
 */
function formatOutput(claims) {
  // Count by type and priority
  const byType = {};
  const byPriority = {};

  claims.forEach(claim => {
    byType[claim.claimType] = (byType[claim.claimType] || 0) + 1;
    byPriority[claim.priority] = (byPriority[claim.priority] || 0) + 1;
  });

  return {
    metadata: {
      extractedAt: new Date().toISOString(),
      totalClaims: claims.length,
      files: FILES_TO_PROCESS,
      byType,
      byPriority
    },
    claims
  };
}

/**
 * Main function
 */
function main() {
  const outputFile = process.argv[2] || path.join(__dirname, 'claim-sources.json');

  console.error('Extracting claim-source pairs from markdown files...\n');
  const claims = extractAllClaimSources();

  console.error(`\nTotal: ${claims.length} claim-source pairs extracted`);

  const output = formatOutput(claims);

  console.error(`\nBreakdown by type:`);
  Object.entries(output.metadata.byType).forEach(([type, count]) => {
    console.error(`  ${type}: ${count}`);
  });

  console.error(`\nBreakdown by priority:`);
  Object.entries(output.metadata.byPriority).forEach(([priority, count]) => {
    console.error(`  ${priority}: ${count}`);
  });

  // Write to file
  fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
  console.error(`\nWritten to: ${outputFile}`);
}

main();
