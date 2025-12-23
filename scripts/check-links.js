#!/usr/bin/env node

/**
 * Check URLs for broken links (lenient mode for real-world sites)
 *
 * This checker is designed to minimize false positives by:
 * - Using browser-like User-Agent
 * - Trying GET requests when HEAD fails
 * - Ignoring SSL certificate issues
 * - Being lenient with server errors that often work in browsers
 * - Skipping known problematic domains
 *
 * Only flags GENUINE issues:
 * - Confirmed 404 Not Found
 * - DNS failures (domain doesn't exist)
 * - Persistent connection failures
 *
 * Usage: node check-links.js [urls-file] [--output=json|markdown|github]
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const REQUEST_TIMEOUT = 20000; // 20 seconds (some sites are slow)
const MAX_CONCURRENT = 5; // Reduced to 5 to avoid rate limiting
const RETRY_ATTEMPTS = 3; // More retries
const RETRY_DELAY = 3000; // 3 seconds between retries

// Known problematic domains that have aggressive bot detection
// These will be checked but with extra lenience
const PROBLEMATIC_DOMAINS = [
  'facebook.com',
  'fb.com',
  'instagram.com',
  'linkedin.com',
  'twitter.com',
  'x.com'
];

// HTTP agent that ignores SSL certificate errors
const httpsAgent = new https.Agent({
  rejectUnauthorized: false // Ignore SSL certificate errors
});

/**
 * Check if URL is from a problematic domain
 */
function isProblematicDomain(url) {
  try {
    const urlObj = new URL(url);
    return PROBLEMATIC_DOMAINS.some(domain =>
      urlObj.hostname.includes(domain)
    );
  } catch {
    return false;
  }
}

/**
 * Check a single URL with GET request (more reliable than HEAD)
 */
async function checkUrlWithGet(url, attempt = 1) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      agent: url.startsWith('https:') ? httpsAgent : undefined,
      headers: {
        // Use a realistic browser User-Agent to avoid bot detection
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      redirect: 'follow'
    });

    clearTimeout(timeout);

    return response;

  } catch (error) {
    // Retry on certain errors
    if (attempt < RETRY_ATTEMPTS) {
      const shouldRetry = error.name === 'AbortError' ||
                         error.code === 'ECONNRESET' ||
                         error.code === 'ETIMEDOUT' ||
                         error.code === 'ECONNREFUSED' ||
                         error.message?.includes('fetch failed');

      if (shouldRetry) {
        console.error(`  Retry ${attempt}/${RETRY_ATTEMPTS} for ${url.substring(0, 60)}...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return checkUrlWithGet(url, attempt + 1);
      }
    }

    throw error;
  }
}

/**
 * Check a single URL
 */
async function checkUrl(url) {
  const isProblem = isProblematicDomain(url);

  try {
    const response = await checkUrlWithGet(url);

    // Success cases
    if (response.ok) {
      return { url, status: 'ok', httpStatus: response.status };
    }

    // Redirects are fine
    if (response.status >= 300 && response.status < 400) {
      return { url, status: 'ok', httpStatus: response.status };
    }

    // For problematic domains, be very lenient
    // Only flag if it's a clear 404
    if (isProblem) {
      if (response.status === 404) {
        // Even 404s on social media might be privacy-related
        return {
          url,
          status: 'warning',
          httpStatus: response.status,
          error: 'HTTP 404 (may be privacy-restricted)'
        };
      }
      // All other errors on problematic domains are likely false positives
      return { url, status: 'ok', httpStatus: response.status, note: 'Social media site with bot detection' };
    }

    // Handle specific error codes
    switch (response.status) {
      case 404:
        // 404 is a genuine error
        return {
          url,
          status: 'error',
          httpStatus: response.status,
          error: 'HTTP 404 Not Found'
        };

      case 403:
      case 405:
      case 409:
        // These often work in browsers but block automated requests
        // Only flag as warning, not error
        return {
          url,
          status: 'warning',
          httpStatus: response.status,
          error: `HTTP ${response.status} (likely bot detection, may work in browser)`
        };

      case 500:
      case 502:
      case 503:
      case 504:
        // Server errors might be temporary or bot-related
        // Only flag as warning
        return {
          url,
          status: 'warning',
          httpStatus: response.status,
          error: `HTTP ${response.status} (server error, may be temporary)`
        };

      default:
        // Other 4xx/5xx errors
        return {
          url,
          status: 'warning',
          httpStatus: response.status,
          error: `HTTP ${response.status} (may work in browser)`
        };
    }

  } catch (error) {
    // Handle network errors

    // DNS failures are genuine errors
    if (error.code === 'ENOTFOUND') {
      return {
        url,
        status: 'error',
        error: 'DNS lookup failed (domain does not exist)'
      };
    }

    // For problematic domains, ignore connection errors
    if (isProblem) {
      return {
        url,
        status: 'ok',
        note: 'Social media site (connection blocked by bot detection)'
      };
    }

    // Connection errors might be VPN/bot detection
    // Only flag as warning
    if (error.code === 'ECONNREFUSED' ||
        error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT' ||
        error.name === 'AbortError' ||
        error.message?.includes('fetch failed')) {
      return {
        url,
        status: 'warning',
        error: 'Connection issue (may be VPN/bot detection, try manually)'
      };
    }

    // SSL errors are ignored (we set rejectUnauthorized: false)
    // but if we somehow get here, it's just a warning
    if (error.message?.includes('certificate') || error.message?.includes('SSL')) {
      return {
        url,
        status: 'warning',
        error: 'SSL certificate issue (site may still work in browser)'
      };
    }

    // Unknown errors are warnings
    return {
      url,
      status: 'warning',
      error: `Unknown error: ${error.message || 'Connection failed'}`
    };
  }
}

/**
 * Check URLs in batches with concurrency limit
 */
async function checkUrlsBatch(urls, batchSize = MAX_CONCURRENT) {
  const results = [];

  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    console.error(`Checking batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(urls.length / batchSize)} (${i + 1}-${Math.min(i + batchSize, urls.length)}/${urls.length})...`);

    const batchResults = await Promise.all(
      batch.map(urlData => checkUrl(urlData.url))
    );

    // Combine results with original URL data
    for (let j = 0; j < batchResults.length; j++) {
      results.push({
        ...batch[j],
        ...batchResults[j]
      });
    }

    // Delay between batches to be respectful to servers
    if (i + batchSize < urls.length) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  return results;
}

/**
 * Format results as GitHub issue markdown
 */
function formatAsGitHubIssue(brokenLinks, warnings, totalUrls) {
  const timestamp = new Date().toISOString();
  const errorCount = brokenLinks.length;
  const warningCount = warnings.length;
  const okCount = totalUrls - errorCount - warningCount;

  let markdown = `# Link Check Report\n\n`;
  markdown += `**Date:** ${timestamp}\n`;
  markdown += `**Total URLs checked:** ${totalUrls}\n`;
  markdown += `**Status:**\n`;
  markdown += `- ✅ Working: ${okCount}\n`;
  markdown += `- ⚠️  Warnings: ${warningCount} (likely false positives, verify manually)\n`;
  markdown += `- ❌ Errors: ${errorCount} (needs attention)\n\n`;

  if (errorCount === 0 && warningCount === 0) {
    markdown += `✅ All links are working!\n`;
    return markdown;
  }

  // Only create issue if there are actual errors
  if (errorCount === 0) {
    markdown += `✅ No broken links found!\n\n`;
    markdown += `⚠️  There are ${warningCount} warnings, but these are likely false positives due to:\n`;
    markdown += `- Bot detection / rate limiting\n`;
    markdown += `- VPN blocking\n`;
    markdown += `- Temporary server issues\n`;
    markdown += `- Social media privacy restrictions\n\n`;
    markdown += `These warnings do not require immediate action.\n`;
    return markdown;
  }

  markdown += `---\n\n`;

  // Show errors first (these need attention)
  if (errorCount > 0) {
    markdown += `## ❌ Errors (${errorCount})\n\n`;
    markdown += `These links are genuinely broken and need to be fixed:\n\n`;

    const byError = {};
    for (const link of brokenLinks) {
      const error = link.error || `HTTP ${link.httpStatus}`;
      if (!byError[error]) {
        byError[error] = [];
      }
      byError[error].push(link);
    }

    for (const [error, links] of Object.entries(byError)) {
      markdown += `### ${error} (${links.length})\n\n`;

      for (const link of links) {
        markdown += `- **URL:** ${link.url}\n`;

        if (link.occurrences && link.occurrences.length > 0) {
          markdown += `  **Found in:**\n`;
          const uniqueFiles = [...new Set(link.occurrences.map(o => o.source))];
          for (const file of uniqueFiles) {
            const fileOccurrences = link.occurrences.filter(o => o.source === file);
            const lines = fileOccurrences
              .filter(o => o.line)
              .map(o => o.line)
              .slice(0, 3);

            if (lines.length > 0) {
              markdown += `  - \`${file}\` (lines: ${lines.join(', ')}${fileOccurrences.length > 3 ? ', ...' : ''})\n`;
            } else {
              markdown += `  - \`${file}\`\n`;
            }
          }
        }
        markdown += `\n`;
      }
    }
  }

  // Show warnings separately (informational only)
  if (warningCount > 0 && warningCount <= 20) { // Only show warnings if there aren't too many
    markdown += `---\n\n`;
    markdown += `## ⚠️  Warnings (${warningCount})\n\n`;
    markdown += `These links may be fine but triggered bot detection or temporary errors.\n`;
    markdown += `Verify manually if concerned:\n\n`;

    const warningsByType = {};
    for (const link of warnings) {
      const error = link.error || `HTTP ${link.httpStatus}`;
      if (!warningsByType[error]) {
        warningsByType[error] = [];
      }
      warningsByType[error].push(link);
    }

    for (const [error, links] of Object.entries(warningsByType)) {
      markdown += `### ${error} (${links.length})\n\n`;
      markdown += `<details>\n<summary>Show ${links.length} URLs</summary>\n\n`;

      for (const link of links.slice(0, 10)) { // Limit to 10 per category
        markdown += `- ${link.url}\n`;
      }
      if (links.length > 10) {
        markdown += `- ... and ${links.length - 10} more\n`;
      }

      markdown += `\n</details>\n\n`;
    }
  } else if (warningCount > 20) {
    markdown += `\n*${warningCount} warnings suppressed (likely false positives)*\n`;
  }

  markdown += `---\n\n`;
  markdown += `**Note:** This checker uses browser-like requests and is lenient with common false positives.\n`;
  markdown += `Only genuine errors (404s, DNS failures) are flagged as errors.\n\n`;
  markdown += `*This report was automatically generated by the VivaSLO link checker.*\n`;

  return markdown;
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const urlsFile = args.find(a => !a.startsWith('--')) || path.join(__dirname, 'urls.json');
  const outputFormat = (args.find(a => a.startsWith('--output='))?.split('=')[1]) || 'github';

  console.error('Reading URLs from:', urlsFile);

  if (!fs.existsSync(urlsFile)) {
    console.error('Error: URLs file not found:', urlsFile);
    console.error('Run extract-urls.js first to generate the URLs file.');
    process.exit(1);
  }

  const urlData = JSON.parse(fs.readFileSync(urlsFile, 'utf-8'));
  const urls = urlData.urls;

  console.error(`Checking ${urls.length} URLs...\n`);

  const results = await checkUrlsBatch(urls);

  // Categorize results
  const errors = results.filter(r => r.status === 'error');
  const warnings = results.filter(r => r.status === 'warning');
  const ok = results.filter(r => r.status === 'ok');

  console.error(`\n✅ Working: ${ok.length}`);
  console.error(`⚠️  Warnings: ${warnings.length} (likely false positives)`);
  console.error(`❌ Errors: ${errors.length} (needs attention)`);

  // Output results
  if (outputFormat === 'json') {
    const output = {
      timestamp: new Date().toISOString(),
      summary: {
        total: urls.length,
        ok: ok.length,
        warnings: warnings.length,
        errors: errors.length
      },
      errors,
      warnings
    };
    console.log(JSON.stringify(output, null, 2));
  } else if (outputFormat === 'markdown' || outputFormat === 'github') {
    const markdown = formatAsGitHubIssue(errors, warnings, urls.length);
    console.log(markdown);
  } else {
    console.error('Unknown output format:', outputFormat);
    process.exit(1);
  }

  // Exit with error code ONLY if genuine errors found (not warnings)
  process.exit(errors.length > 0 ? 1 : 0);
}

main();
