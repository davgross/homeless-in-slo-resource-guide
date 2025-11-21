#!/usr/bin/env node

/**
 * Markdown Validation Tool for Resource Guide
 *
 * Validates:
 * 1. Markdown lint rules (via markdownlint-cli)
 * 2. Spelling (via spell-check.js)
 * 3. Unique anchors within each file
 * 4. Valid internal anchor references (within and between files)
 * 5. data-directory-link attributes reference valid Directory anchors
 * 6. Phone number format consistency
 * 7. URL validity (basic syntax check)
 * 8. Orphaned anchors (anchors never referenced) - informational only
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// Files to validate
const FILES = ['About.md', 'Directory.md', 'Resource guide.md'];

// Parse command line arguments
const args = process.argv.slice(2);
const verbose = args.includes('--verbose') || args.includes('-v');
const showOrphans = args.includes('--orphans') || args.includes('-o');
const showHelp = args.includes('--help') || args.includes('-h');

// Colors for terminal output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

// Track all issues
const issues = {
  errors: [],
  warnings: []
};

function addError(file, line, message) {
  issues.errors.push({ file, line, message });
}

function addWarning(file, line, message) {
  issues.warnings.push({ file, line, message });
}

/**
 * Extract all anchors from a markdown file
 * Handles: <a id="anchor-name">, <a id='anchor-name'>, and ## Heading {#anchor}
 */
function extractAnchors(content, filename) {
  const anchors = new Map(); // anchor -> array of line numbers
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Match <a id="..."> or <a id='...'>
    const idMatches = line.matchAll(/<a\s+id=["']([^"']+)["']/gi);
    for (const match of idMatches) {
      const anchor = match[1];
      if (!anchors.has(anchor)) {
        anchors.set(anchor, []);
      }
      anchors.get(anchor).push(lineNum);
    }

    // Match markdown heading anchors {#anchor}
    const headingMatch = line.match(/^#{1,6}\s+.*\{#([^}]+)\}/);
    if (headingMatch) {
      const anchor = headingMatch[1];
      if (!anchors.has(anchor)) {
        anchors.set(anchor, []);
      }
      anchors.get(anchor).push(lineNum);
    }
  }

  return anchors;
}

/**
 * Extract all internal links from a markdown file
 * Returns array of { target, line, isExternal, targetFile, anchor }
 */
function extractLinks(content, filename) {
  const links = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Match markdown links [text](url)
    const linkMatches = line.matchAll(/\[([^\]]*)\]\(([^)]+)\)/g);
    for (const match of linkMatches) {
      const url = match[2];

      // Skip external URLs, tel:, mailto:, sms:
      if (url.match(/^(https?:|mailto:|tel:|sms:|ftp:)/i)) {
        continue;
      }

      // Internal anchor link: (#anchor) or (File.md#anchor) or (File#anchor)
      const anchorMatch = url.match(/^([^#]*)?#(.+)$/);
      if (anchorMatch) {
        const targetFile = anchorMatch[1] || filename;
        const anchor = anchorMatch[2];
        links.push({
          target: url,
          line: lineNum,
          targetFile: normalizeFilename(targetFile),
          anchor
        });
      }
    }

    // Match data-directory-link attributes
    const dirLinkMatches = line.matchAll(/data-directory-link=["']([^"']+)["']/g);
    for (const match of dirLinkMatches) {
      const anchor = match[1];
      // Skip example placeholder
      if (anchor === 'example') continue;
      links.push({
        target: `data-directory-link="${anchor}"`,
        line: lineNum,
        targetFile: 'Directory.md',
        anchor,
        isDirectoryLink: true
      });
    }
  }

  return links;
}

/**
 * Normalize filename for comparison
 */
function normalizeFilename(filename) {
  if (!filename) return null;
  // Remove .md extension if present, then add it back
  let normalized = filename.replace(/\.md$/i, '');
  // Handle "Directory" vs "Directory.md"
  return normalized + '.md';
}

/**
 * Check for duplicate anchors within a file
 */
function checkDuplicateAnchors(anchors, filename) {
  let duplicateCount = 0;
  for (const [anchor, lines] of anchors.entries()) {
    if (lines.length > 1) {
      addError(filename, lines.join(', '), `Duplicate anchor "${anchor}" found on lines: ${lines.join(', ')}`);
      duplicateCount++;
    }
  }
  return duplicateCount;
}

/**
 * Validate all internal links
 */
function validateLinks(allAnchors, allLinks) {
  let brokenCount = 0;

  for (const [sourceFile, links] of Object.entries(allLinks)) {
    for (const link of links) {
      const targetFile = link.targetFile;
      const anchor = link.anchor;

      // Check if target file exists in our set
      if (!allAnchors[targetFile]) {
        addError(sourceFile, link.line, `Link to unknown file "${targetFile}": ${link.target}`);
        brokenCount++;
        continue;
      }

      // Check if anchor exists in target file
      if (!allAnchors[targetFile].has(anchor)) {
        addError(sourceFile, link.line, `Broken link - anchor "${anchor}" not found in ${targetFile}: ${link.target}`);
        brokenCount++;
      }
    }
  }

  return brokenCount;
}

/**
 * Find orphaned anchors (anchors that are never referenced)
 */
function findOrphanedAnchors(allAnchors, allLinks) {
  // Collect all referenced anchors
  const referencedAnchors = new Map(); // file -> Set of anchors

  for (const [sourceFile, links] of Object.entries(allLinks)) {
    for (const link of links) {
      const targetFile = link.targetFile;
      if (!referencedAnchors.has(targetFile)) {
        referencedAnchors.set(targetFile, new Set());
      }
      referencedAnchors.get(targetFile).add(link.anchor);
    }
  }

  const orphaned = [];
  for (const [file, anchors] of Object.entries(allAnchors)) {
    const referenced = referencedAnchors.get(file) || new Set();
    for (const [anchor, lines] of anchors.entries()) {
      if (!referenced.has(anchor)) {
        orphaned.push({ file, anchor, line: lines[0] });
      }
    }
  }

  return orphaned;
}

/**
 * Check phone number format consistency
 * Expected format: 805-123-4567 (kebab format)
 */
function checkPhoneNumbers(content, filename) {
  const lines = content.split('\n');
  let issueCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Find phone numbers in various formats
    // Match (XXX) XXX-XXXX format
    const parenMatches = line.matchAll(/\((\d{3})\)\s*(\d{3})[.-](\d{4})/g);
    for (const match of parenMatches) {
      addWarning(filename, lineNum, `Phone number uses parentheses format: ${match[0]} - should be ${match[1]}-${match[2]}-${match[3]}`);
      issueCount++;
    }

    // Match XXX.XXX.XXXX format (dots instead of dashes)
    const dotMatches = line.matchAll(/\b(\d{3})\.(\d{3})\.(\d{4})\b/g);
    for (const match of dotMatches) {
      addWarning(filename, lineNum, `Phone number uses dots: ${match[0]} - should use dashes`);
      issueCount++;
    }

    // Match 1-XXX-XXX-XXXX format (leading 1)
    // Only flag if it's in the display text, not in tel: URL
    const leadingOneMatches = line.matchAll(/(?<!\+)(?<!tel:\+)1[.-](\d{3})[.-](\d{3})[.-](\d{4})\b/g);
    for (const match of leadingOneMatches) {
      // Check if this is inside a tel: URL (those should have +1)
      const beforeMatch = line.slice(0, match.index);
      if (!beforeMatch.includes('tel:')) {
        addWarning(filename, lineNum, `Phone number has leading 1: ${match[0]} - should omit the leading 1-`);
        issueCount++;
      }
    }
  }

  return issueCount;
}

/**
 * Check for common markdown issues
 */
function checkMarkdownIssues(content, filename) {
  const lines = content.split('\n');
  let issueCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Check for tabs (should use spaces)
    if (line.includes('\t')) {
      addWarning(filename, lineNum, 'Line contains tab character - consider using spaces');
      issueCount++;
    }

    // Check for trailing whitespace (more than 2 spaces which is intentional line break)
    if (line.match(/[^ ]  +$/) && !line.match(/  $/)) {
      addWarning(filename, lineNum, 'Line has excessive trailing whitespace');
      issueCount++;
    }

    // Check for broken markdown links (missing closing paren or bracket)
    if (line.match(/\[[^\]]*\]\([^)]*$/) && !lines[i + 1]?.match(/^[^[]*\)/)) {
      addWarning(filename, lineNum, 'Possible broken markdown link (missing closing parenthesis)');
      issueCount++;
    }

    // Check for empty links
    if (line.match(/\[\]\(/)) {
      addWarning(filename, lineNum, 'Empty link text found');
      issueCount++;
    }

    // Check for http:// links that should probably be https://
    // Skip HTML comments
    if (!line.trim().startsWith('<!--')) {
      const httpMatches = line.matchAll(/\[([^\]]+)\]\((http:\/\/[^)]+)\)/g);
      for (const match of httpMatches) {
        addWarning(filename, lineNum, `Link uses http:// instead of https://: ${match[2]}`);
        issueCount++;
      }
    }
  }

  return issueCount;
}

/**
 * Check for en-dash usage in ranges
 * Per project style: all ranges should use en-dashes, including M–F, Tu–Sa, 8am–5pm, $5–10
 */
function checkDashUsage(content, filename) {
  const lines = content.split('\n');
  let issueCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Skip HTML comments
    if (line.trim().startsWith('<!--')) continue;

    // Check for time ranges with hyphen instead of en-dash
    // e.g., "8am-5pm" should be "8am–5pm"
    const timeRangeHyphen = line.match(/\d+(?::?\d+)?(?:am|pm)\s*-\s*\d+(?::?\d+)?(?:am|pm)/i);
    if (timeRangeHyphen) {
      addWarning(filename, lineNum, `Time range uses hyphen instead of en-dash: ${timeRangeHyphen[0]}`);
      issueCount++;
    }

    // Check for day ranges with hyphen (both full names and abbreviations)
    // e.g., "Monday-Friday" or "M-F" should use en-dashes
    const dayRangeHyphen = line.match(/\b(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Mon|Tue|Wed|Thu|Fri|Sat|Sun|Mo|Tu|We|Th|Fr|Sa|Su|M|W|F)\s*-\s*(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Mon|Tue|Wed|Thu|Fri|Sat|Sun|Mo|Tu|We|Th|Fr|Sa|Su|M|W|F)\b/i);
    if (dayRangeHyphen) {
      addWarning(filename, lineNum, `Day range uses hyphen instead of en-dash: ${dayRangeHyphen[0]}`);
      issueCount++;
    }

    // Check for price ranges with hyphen (but not in URLs or code)
    const priceRangeHyphen = line.match(/\$\d+\s*-\s*(?:\$)?\d+(?!\d)/);
    if (priceRangeHyphen && !line.includes('http') && !line.includes('`')) {
      addWarning(filename, lineNum, `Price range uses hyphen instead of en-dash: ${priceRangeHyphen[0]}`);
      issueCount++;
    }
  }

  return issueCount;
}

/**
 * Run markdownlint
 */
function runMarkdownLint(files) {
  console.log(colorize('\n📝 Running markdownlint...', 'cyan'));

  const result = spawnSync('npx', ['markdownlint', ...files], {
    encoding: 'utf8',
    cwd: __dirname
  });

  if (result.error) {
    console.log(colorize('  ⚠ markdownlint not available or failed to run', 'yellow'));
    console.log(`    ${result.error.message}`);
    return false;
  }

  const output = (result.stdout + result.stderr).trim();
  if (output) {
    console.log(output);
    return false;
  }

  console.log(colorize('  ✓ No markdownlint issues found', 'green'));
  return true;
}

/**
 * Run spell-check.js
 */
function runSpellCheck() {
  console.log(colorize('\n📖 Running spell check...', 'cyan'));

  const result = spawnSync('node', ['spell-check.js'], {
    encoding: 'utf8',
    cwd: __dirname
  });

  if (result.error) {
    console.log(colorize('  ⚠ spell-check.js failed to run', 'yellow'));
    console.log(`    ${result.error.message}`);
    return false;
  }

  console.log(result.stdout);
  if (result.stderr) {
    console.log(result.stderr);
  }

  // Check if there were any issues (look for "Total potentially misspelled words: 0")
  return result.stdout.includes('Total potentially misspelled words: 0');
}

/**
 * Main validation function
 */
function main() {
  // Show help if requested
  if (showHelp) {
    console.log(`
Markdown Validation Tool

Usage: node validate-markdown.js [options]

Options:
  -v, --verbose   Show all warnings (not just first 20)
  -o, --orphans   Show all orphaned anchors (not just first 10)
  -h, --help      Show this help message

Validates:
  - Markdown lint rules (via markdownlint-cli)
  - Spelling (via spell-check.js)
  - Unique anchors within each file
  - Valid internal anchor references
  - data-directory-link attributes reference valid Directory anchors
  - Phone number format consistency
  - En-dash usage in ranges (times, days, prices)
  - HTTP vs HTTPS links
`);
    process.exit(0);
  }

  console.log(colorize('═'.repeat(60), 'blue'));
  console.log(colorize('  Markdown Validation Tool', 'bold'));
  console.log(colorize('═'.repeat(60), 'blue'));

  // Check that all files exist
  const existingFiles = [];
  for (const file of FILES) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      existingFiles.push(file);
    } else {
      console.log(colorize(`\n⚠ File not found: ${file}`, 'yellow'));
    }
  }

  if (existingFiles.length === 0) {
    console.log(colorize('\n❌ No files to validate!', 'red'));
    process.exit(1);
  }

  // Run external tools
  const markdownLintPassed = runMarkdownLint(existingFiles);
  const spellCheckPassed = runSpellCheck();

  // Load all files and extract anchors/links
  console.log(colorize('\n🔗 Checking anchors and links...', 'cyan'));

  const allAnchors = {};
  const allLinks = {};
  const fileContents = {};

  for (const file of existingFiles) {
    const filePath = path.join(__dirname, file);
    const content = fs.readFileSync(filePath, 'utf8');
    fileContents[file] = content;
    allAnchors[file] = extractAnchors(content, file);
    allLinks[file] = extractLinks(content, file);
  }

  // Check for duplicate anchors
  console.log(colorize('\n  Checking for duplicate anchors...', 'cyan'));
  let totalDuplicates = 0;
  for (const file of existingFiles) {
    const duplicates = checkDuplicateAnchors(allAnchors[file], file);
    totalDuplicates += duplicates;
    if (duplicates === 0) {
      console.log(colorize(`    ✓ ${file}: No duplicate anchors`, 'green'));
    } else {
      console.log(colorize(`    ✗ ${file}: ${duplicates} duplicate anchor(s)`, 'red'));
    }
  }

  // Validate internal links
  console.log(colorize('\n  Validating internal links...', 'cyan'));
  const brokenLinks = validateLinks(allAnchors, allLinks);
  if (brokenLinks === 0) {
    console.log(colorize('    ✓ All internal links are valid', 'green'));
  } else {
    console.log(colorize(`    ✗ ${brokenLinks} broken link(s) found`, 'red'));
  }

  // Check phone number formats
  console.log(colorize('\n📞 Checking phone number formats...', 'cyan'));
  let totalPhoneIssues = 0;
  for (const file of existingFiles) {
    const phoneIssues = checkPhoneNumbers(fileContents[file], file);
    totalPhoneIssues += phoneIssues;
  }
  if (totalPhoneIssues === 0) {
    console.log(colorize('  ✓ All phone numbers follow expected format', 'green'));
  } else {
    console.log(colorize(`  ⚠ ${totalPhoneIssues} phone format warning(s)`, 'yellow'));
  }

  // Check dash usage
  console.log(colorize('\n📏 Checking en-dash usage in ranges...', 'cyan'));
  let totalDashIssues = 0;
  for (const file of existingFiles) {
    const dashIssues = checkDashUsage(fileContents[file], file);
    totalDashIssues += dashIssues;
  }
  if (totalDashIssues === 0) {
    console.log(colorize('  ✓ Range formatting looks correct', 'green'));
  } else {
    console.log(colorize(`  ⚠ ${totalDashIssues} potential dash usage warning(s)`, 'yellow'));
  }

  // Check other markdown issues
  console.log(colorize('\n🔍 Checking for common markdown issues...', 'cyan'));
  let totalMarkdownIssues = 0;
  for (const file of existingFiles) {
    const mdIssues = checkMarkdownIssues(fileContents[file], file);
    totalMarkdownIssues += mdIssues;
  }
  if (totalMarkdownIssues === 0) {
    console.log(colorize('  ✓ No common markdown issues found', 'green'));
  } else {
    console.log(colorize(`  ⚠ ${totalMarkdownIssues} markdown warning(s)`, 'yellow'));
  }

  // Find orphaned anchors (informational only)
  console.log(colorize('\n📎 Finding orphaned anchors (informational)...', 'cyan'));
  const orphanedAnchors = findOrphanedAnchors(allAnchors, allLinks);
  if (orphanedAnchors.length === 0) {
    console.log(colorize('  ✓ All anchors are referenced somewhere', 'green'));
  } else {
    console.log(colorize(`  ℹ ${orphanedAnchors.length} anchor(s) are never referenced:`, 'blue'));
    const orphanLimit = (verbose || showOrphans) ? orphanedAnchors.length : 10;
    const shown = orphanedAnchors.slice(0, orphanLimit);
    for (const orphan of shown) {
      console.log(colorize(`    - ${orphan.file}:${orphan.line} #${orphan.anchor}`, 'blue'));
    }
    if (orphanedAnchors.length > orphanLimit) {
      console.log(colorize(`    ... and ${orphanedAnchors.length - orphanLimit} more (use --orphans to see all)`, 'blue'));
    }
  }

  // Summary
  console.log(colorize('\n' + '═'.repeat(60), 'blue'));
  console.log(colorize('  Summary', 'bold'));
  console.log(colorize('═'.repeat(60), 'blue'));

  // Print all errors
  if (issues.errors.length > 0) {
    console.log(colorize(`\n❌ Errors (${issues.errors.length}):`, 'red'));
    for (const error of issues.errors) {
      console.log(colorize(`  ${error.file}:${error.line}: ${error.message}`, 'red'));
    }
  }

  // Print all warnings
  if (issues.warnings.length > 0) {
    console.log(colorize(`\n⚠ Warnings (${issues.warnings.length}):`, 'yellow'));
    const warningLimit = verbose ? issues.warnings.length : 20;
    const shownWarnings = issues.warnings.slice(0, warningLimit);
    for (const warning of shownWarnings) {
      console.log(colorize(`  ${warning.file}:${warning.line}: ${warning.message}`, 'yellow'));
    }
    if (issues.warnings.length > warningLimit) {
      console.log(colorize(`  ... and ${issues.warnings.length - warningLimit} more warnings (use --verbose to see all)`, 'yellow'));
    }
  }

  // Final status
  console.log('\n' + '─'.repeat(60));
  const hasErrors = issues.errors.length > 0 || !markdownLintPassed;
  const hasWarnings = issues.warnings.length > 0 || !spellCheckPassed;

  if (!hasErrors && !hasWarnings) {
    console.log(colorize('✅ All validations passed!', 'green'));
    process.exit(0);
  } else if (!hasErrors) {
    console.log(colorize('✅ No errors, but some warnings to review.', 'yellow'));
    process.exit(0);
  } else {
    console.log(colorize('❌ Validation failed with errors.', 'red'));
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  extractAnchors,
  extractLinks,
  validateLinks,
  checkDuplicateAnchors
};
