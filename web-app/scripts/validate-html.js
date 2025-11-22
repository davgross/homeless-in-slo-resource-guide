#!/usr/bin/env node
/**
 * HTML validation script for the SLO Resource Guide
 *
 * This script validates the built HTML and filters out known issues
 * from third-party plugins (like vite-plugin-pwa's invalid id).
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';

const distHtml = 'dist/index.html';

// Known issues to filter (patterns from third-party plugins we can't control)
const knownIssues = [
  'vite-plugin-pwa:register-sw',  // PWA plugin injects id with colons
];

function isKnownIssue(text) {
  return knownIssues.some(issue => text.includes(issue));
}

// Check if a line is an actual error report (not a summary line)
function isErrorLine(line) {
  // Error lines look like: "  17:64  error  element id..."
  // Summary lines look like: "✖ 1 problem (1 error, 0 warnings)"
  return line.includes('error') && /^\s*\d+:\d+\s+error/.test(line);
}

function validateHtml() {
  // First, validate the source HTML (should have no issues)
  console.log('Validating source HTML...');
  try {
    execSync('npx html-validate index.html', { stdio: 'inherit' });
    console.log('✓ Source HTML is valid\n');
  } catch (error) {
    console.error('✗ Source HTML validation failed');
    process.exit(1);
  }

  // Then validate the dist HTML
  if (!existsSync(distHtml)) {
    console.log('No dist/index.html found - skipping dist validation');
    return;
  }

  console.log('Validating dist HTML...');

  let output = '';

  try {
    output = execSync('npx html-validate dist/index.html 2>&1', { encoding: 'utf8' });
    console.log('✓ Dist HTML is valid\n');
    return;
  } catch (e) {
    // execSync throws on non-zero exit, capture the output from stdout
    output = e.stdout || '';
  }

  // If no output was captured, something went wrong
  if (!output) {
    console.error('✗ Validation failed but no output captured');
    process.exit(1);
  }

  // Parse error lines (actual error reports, not summary lines)
  const lines = output.split('\n');
  const errorLines = lines.filter(line => isErrorLine(line));

  // Check if all error lines are known issues
  const allKnown = errorLines.length > 0 && errorLines.every(line => isKnownIssue(line));

  if (allKnown) {
    console.log('⚠ Dist HTML has known third-party plugin issues (acceptable):');
    knownIssues.forEach(issue => {
      if (output.includes(issue)) {
        console.log(`  - "${issue}" (injected by vite-plugin-pwa, not our code)`);
      }
    });
    console.log('✓ No unexpected HTML validation errors\n');
    return;
  }

  // If we get here, there are unexpected errors
  console.error('✗ Dist HTML validation failed with unexpected errors:');
  console.error(output);
  process.exit(1);
}

validateHtml();
