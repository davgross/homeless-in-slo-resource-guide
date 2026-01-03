#!/usr/bin/env node

/**
 * Fetch source pages and extract claim-supporting content
 *
 * This script fetches each source URL and uses fuzzy matching to find the
 * specific claim text on the page. It supports HTML and PDF sources and
 * normalizes content to handle formatting variations.
 *
 * Output: source-snapshots.json containing snapshots of each source with:
 * - HTTP status and fetch time
 * - Match confidence score
 * - Matched text and surrounding context
 * - Content hash (for change detection)
 *
 * Usage: node fetch-source-content.js [claims-file] [output-file]
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';
import pdfParse from 'pdf-parse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const REQUEST_TIMEOUT = 20000; // 20 seconds
const MAX_CONCURRENT = 5; // Limit concurrent requests
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 3000; // 3 seconds
const CONTEXT_LENGTH = 500; // chars of context to extract

// HTTPS agent that ignores SSL certificate errors
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

/**
 * Normalize text for fuzzy matching based on claim type
 */
function normalizeText(text, claimType) {
  if (!text) return '';

  let normalized = text.toLowerCase();

  switch (claimType) {
    case 'phone':
      // Remove all formatting: (805) 544-4004 -> 8055444004
      normalized = normalized.replace(/[\s\-\(\)\+\.]/g, '');
      normalized = normalized.replace(/^1/, ''); // Strip leading 1
      // Also try partial matches (last 7 digits for local numbers)
      break;

    case 'hours':
      // Remove colons and periods from times
      normalized = normalized.replace(/:/g, '');
      normalized = normalized.replace(/\./g, '');
      // Normalize day abbreviations
      normalized = normalized.replace(/\b(mon|mo)\b/gi, 'monday');
      normalized = normalized.replace(/\b(tue|tu)\b/gi, 'tuesday');
      normalized = normalized.replace(/\b(wed|we)\b/gi, 'wednesday');
      normalized = normalized.replace(/\b(thu|th)\b/gi, 'thursday');
      normalized = normalized.replace(/\b(fri|fr)\b/gi, 'friday');
      normalized = normalized.replace(/\b(sat|sa)\b/gi, 'saturday');
      normalized = normalized.replace(/\b(sun|su)\b/gi, 'sunday');
      break;

    case 'address':
      // Expand abbreviations
      normalized = normalized.replace(/\bst\.?\b/g, 'street');
      normalized = normalized.replace(/\bave\.?\b/g, 'avenue');
      normalized = normalized.replace(/\brd\.?\b/g, 'road');
      normalized = normalized.replace(/\bblvd\.?\b/g, 'boulevard');
      normalized = normalized.replace(/\bdr\.?\b/g, 'drive');
      normalized = normalized.replace(/\bln\.?\b/g, 'lane');
      normalized = normalized.replace(/\bct\.?\b/g, 'court');
      break;

    case 'email':
      // Email normalization is just lowercase
      break;

    case 'general':
    default:
      // General: just collapse whitespace
      normalized = normalized.replace(/\s+/g, ' ').trim();
      break;
  }

  // Universal: collapse whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
}

/**
 * Extract text content from HTML
 */
function extractTextFromHtml(html) {
  try {
    const $ = cheerio.load(html);

    // Remove script, style, and nav elements
    $('script').remove();
    $('style').remove();
    $('nav').remove();
    $('footer').remove();

    // Get text from body
    const text = $('body').text() || $.text();

    // Clean up whitespace
    return text.replace(/\s+/g, ' ').trim();
  } catch (error) {
    console.warn('Error parsing HTML:', error.message);
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }
}

/**
 * Extract text content from PDF buffer
 */
async function extractTextFromPdf(buffer) {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.warn('Error parsing PDF:', error.message);
    return '';
  }
}

/**
 * Fetch URL content with retry logic
 */
async function fetchUrl(url, attempt = 1) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      agent: url.startsWith('https:') ? httpsAgent : undefined,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml,application/pdf;q=0.9,*/*;q=0.8',
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
                         error.message.includes('fetch failed');

      if (shouldRetry) {
        console.warn(`  Retry ${attempt}/${RETRY_ATTEMPTS} for ${url}`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return fetchUrl(url, attempt + 1);
      }
    }

    throw error;
  }
}

/**
 * Find claim in text content using fuzzy matching
 */
function findClaimInContent(searchableCore, content, claimType) {
  const normalizedClaim = normalizeText(searchableCore, claimType);
  const normalizedContent = normalizeText(content, claimType);

  if (!normalizedClaim || !normalizedContent) {
    return { found: false, confidence: 0.0 };
  }

  // Try exact normalized match first
  const exactIndex = normalizedContent.indexOf(normalizedClaim);
  if (exactIndex !== -1) {
    return {
      found: true,
      confidence: 1.0,
      matchIndex: exactIndex
    };
  }

  // For phone numbers, try matching just the digits
  if (claimType === 'phone') {
    const digitsOnly = normalizedClaim.replace(/\D/g, '');
    if (digitsOnly.length >= 7) {
      // Try matching the full number with digits only
      const contentDigits = normalizedContent.replace(/[^\d]/g, '');
      if (contentDigits.includes(digitsOnly)) {
        // Find position in original content
        const regex = new RegExp(digitsOnly.split('').join('[\\s\\-\\.\\(\\)]*'), 'i');
        const match = content.toLowerCase().match(regex);
        if (match) {
          const matchIndex = content.toLowerCase().indexOf(match[0]);
          return {
            found: true,
            confidence: 0.95,
            matchIndex
          };
        }
      }

      // Try last 7 digits (local number)
      const last7 = digitsOnly.slice(-7);
      if (contentDigits.includes(last7)) {
        return {
          found: true,
          confidence: 0.8,
          matchIndex: normalizedContent.indexOf(last7)
        };
      }
    }
  }

  // For hours, try flexible matching
  if (claimType === 'hours') {
    // Extract key time components from searchableCore
    const times = searchableCore.match(/\d{1,2}(?::\d{2})?\s*(?:am|pm)/gi);

    if (times && times.length > 0) {
      // Check if all key times appear in content (with various separators)
      const allTimesPresent = times.every(time => {
        const normalized = normalizeText(time, 'hours');
        // Try both with and without colon (9am vs 9:00am)
        const timeWithoutColon = time.replace(':', '');
        const timeNormalized = normalizeText(timeWithoutColon, 'hours');

        return normalizedContent.includes(normalized) ||
               normalizedContent.includes(timeNormalized) ||
               normalizedContent.includes(time.toLowerCase());
      });

      if (allTimesPresent) {
        // Find the first time in content
        let matchIndex = -1;
        for (const time of times) {
          const variants = [
            normalizeText(time, 'hours'),
            normalizeText(time.replace(':', ''), 'hours'),
            time.toLowerCase()
          ];

          for (const variant of variants) {
            const idx = normalizedContent.indexOf(variant);
            if (idx !== -1) {
              matchIndex = idx;
              break;
            }
          }
          if (matchIndex !== -1) break;
        }

        if (matchIndex !== -1) {
          return {
            found: true,
            confidence: 0.85,
            matchIndex
          };
        }
      }

      // Fallback: if we found at least some of the times, still consider it a partial match
      const foundTimes = times.filter(time => {
        const variants = [
          normalizeText(time, 'hours'),
          normalizeText(time.replace(':', ''), 'hours'),
          time.toLowerCase()
        ];
        return variants.some(v => normalizedContent.includes(v));
      });

      if (foundTimes.length > 0 && foundTimes.length >= times.length * 0.5) {
        // Found at least half the times
        const firstFoundTime = foundTimes[0];
        const variants = [
          normalizeText(firstFoundTime, 'hours'),
          normalizeText(firstFoundTime.replace(':', ''), 'hours'),
          firstFoundTime.toLowerCase()
        ];

        for (const variant of variants) {
          const idx = normalizedContent.indexOf(variant);
          if (idx !== -1) {
            return {
              found: true,
              confidence: 0.6 + (foundTimes.length / times.length) * 0.2,
              matchIndex: idx
            };
          }
        }
      }
    }

    // Try matching day abbreviations if present
    const dayPatterns = searchableCore.match(/\b(m|t|w|th|f|sa|su|mon|tue|wed|thu|fri|sat|sun|monday|tuesday|wednesday|thursday|friday|saturday|sunday)[-–]+(m|t|w|th|f|sa|su|mon|tue|wed|thu|fri|sat|sun|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);
    if (dayPatterns) {
      const dayRange = dayPatterns[0].toLowerCase();
      if (content.toLowerCase().includes(dayRange)) {
        return {
          found: true,
          confidence: 0.75,
          matchIndex: content.toLowerCase().indexOf(dayRange)
        };
      }
    }
  }

  // For email, try case-insensitive exact match
  if (claimType === 'email') {
    const emailLower = searchableCore.toLowerCase();
    const contentLower = content.toLowerCase();
    if (contentLower.includes(emailLower)) {
      return {
        found: true,
        confidence: 1.0,
        matchIndex: contentLower.indexOf(emailLower)
      };
    }
  }

  // Try word-based matching for longer claims
  if (normalizedClaim.length > 20) {
    // Break claim into words
    const words = normalizedClaim.split(/\s+/).filter(w => w.length > 3);
    if (words.length === 0) {
      return { found: false, confidence: 0.0 };
    }

    const matchedWords = words.filter(word => normalizedContent.includes(word));
    const matchRatio = matchedWords.length / words.length;

    if (matchRatio >= 0.7) {
      // Find index of first matched word in original content
      const firstWord = matchedWords[0];
      const matchIndex = normalizedContent.indexOf(firstWord);
      return {
        found: true,
        confidence: 0.5 + (matchRatio * 0.4), // 0.5-0.9 confidence
        matchIndex
      };
    }
  }

  // Try partial substring matching (for medium-length claims)
  if (normalizedClaim.length >= 10 && normalizedClaim.length <= 50) {
    // Try finding a significant portion
    const halfLength = Math.floor(normalizedClaim.length / 2);
    const firstHalf = normalizedClaim.substring(0, halfLength);
    const secondHalf = normalizedClaim.substring(halfLength);

    if (normalizedContent.includes(firstHalf) || normalizedContent.includes(secondHalf)) {
      const matchIndex = normalizedContent.includes(firstHalf)
        ? normalizedContent.indexOf(firstHalf)
        : normalizedContent.indexOf(secondHalf);
      return {
        found: true,
        confidence: 0.6,
        matchIndex
      };
    }
  }

  // Final fallback: extract distinctive words and check if enough appear
  // Skip very common words
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'is', 'are', 'was', 'were', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'it', 'they', 'them', 'their', 'you', 'your']);

  const words = searchableCore.toLowerCase().split(/\W+/).filter(w => w.length > 4 && !commonWords.has(w));

  if (words.length >= 2) {
    const foundWords = words.filter(word => normalizedContent.includes(word));
    const matchRatio = foundWords.length / words.length;

    if (matchRatio >= 0.5 && foundWords.length >= 2) {
      // Found at least 2 distinctive words with 50%+ match rate
      const firstWord = foundWords[0];
      const matchIndex = normalizedContent.indexOf(firstWord);
      return {
        found: true,
        confidence: 0.4 + (matchRatio * 0.3), // 0.4-0.7 confidence
        matchIndex
      };
    }
  }

  return {
    found: false,
    confidence: 0.0
  };
}

/**
 * Extract context around match
 */
function extractContext(content, matchIndex, contextLength = CONTEXT_LENGTH) {
  const start = Math.max(0, matchIndex - Math.floor(contextLength / 2));
  const end = Math.min(content.length, matchIndex + Math.floor(contextLength / 2));

  let context = content.substring(start, end);

  // Clean up
  context = context.replace(/\s+/g, ' ').trim();

  return context;
}

/**
 * Calculate hash of content
 */
function calculateHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
}

/**
 * Process a single claim-source pair
 */
async function processClaimSource(claim) {
  const result = {
    claimId: claim.id,
    sourceUrl: claim.sourceUrl,
    fetchedAt: new Date().toISOString(),
    httpStatus: null,
    matchConfidence: 0.0,
    matchedText: null,
    matchContext: null,
    claimFound: false,
    contentHash: null,
    error: null
  };

  try {
    console.error(`  Fetching: ${claim.sourceUrl}`);

    const response = await fetchUrl(claim.sourceUrl);
    result.httpStatus = response.status;

    if (response.status !== 200) {
      result.error = `HTTP ${response.status}`;
      return result;
    }

    // Get content type
    const contentType = response.headers.get('content-type') || '';

    let textContent = '';

    if (contentType.includes('application/pdf')) {
      // Handle PDF
      const buffer = Buffer.from(await response.arrayBuffer());
      textContent = await extractTextFromPdf(buffer);
    } else {
      // Handle HTML/text
      const html = await response.text();
      textContent = extractTextFromHtml(html);
    }

    // Find claim in content using searchableCore
    const searchText = claim.searchableCore || claim.claimText;
    const match = findClaimInContent(searchText, textContent, claim.claimType);

    if (match.found) {
      result.claimFound = true;
      result.matchConfidence = match.confidence;

      // Extract matched text and context from original content
      const contextStart = Math.max(0, match.matchIndex - 50);
      const contextEnd = Math.min(textContent.length, match.matchIndex + 150);
      result.matchedText = textContent.substring(match.matchIndex, match.matchIndex + 100).trim();
      result.matchContext = extractContext(textContent, match.matchIndex);

      // Calculate hash of relevant section
      result.contentHash = calculateHash(result.matchContext);
    } else {
      result.error = `Claim not found on page (searched for: "${searchText.substring(0, 50)}...")`;
    }

  } catch (error) {
    result.error = error.message;
    console.warn(`  Error fetching ${claim.sourceUrl}:`, error.message);
  }

  return result;
}

/**
 * Process claims with concurrency limit
 */
async function processClaims(claims) {
  const results = [];
  let index = 0;

  // Simple approach: process in batches
  while (index < claims.length) {
    const batch = claims.slice(index, index + MAX_CONCURRENT);
    const batchResults = await Promise.all(
      batch.map(claim => processClaimSource(claim))
    );
    results.push(...batchResults);
    index += MAX_CONCURRENT;

    // Progress update
    if (index % 20 === 0 || index >= claims.length) {
      console.error(`  Progress: ${Math.min(index, claims.length)}/${claims.length}`);
    }
  }

  return results;
}

/**
 * Main function
 */
async function main() {
  const claimsFile = process.argv[2] || path.join(__dirname, 'claim-sources.json');
  const outputFile = process.argv[3] || path.join(__dirname, 'source-snapshots.json');

  console.error('Loading claims...');
  const claimsData = JSON.parse(fs.readFileSync(claimsFile, 'utf-8'));
  const claims = claimsData.claims;

  console.error(`Processing ${claims.length} claim-source pairs...\n`);

  const startTime = Date.now();
  const snapshots = await processClaims(claims);
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  // Calculate stats
  const successful = snapshots.filter(s => s.claimFound).length;
  const failed = snapshots.filter(s => !s.claimFound).length;
  const highConfidence = snapshots.filter(s => s.matchConfidence >= 0.9).length;
  const mediumConfidence = snapshots.filter(s => s.matchConfidence >= 0.7 && s.matchConfidence < 0.9).length;
  const lowConfidence = snapshots.filter(s => s.matchConfidence > 0 && s.matchConfidence < 0.7).length;

  console.error(`\nCompleted in ${duration}s`);
  console.error(`  Claims found: ${successful} (${((successful/snapshots.length)*100).toFixed(1)}%)`);
  console.error(`  Claims not found: ${failed} (${((failed/snapshots.length)*100).toFixed(1)}%)`);
  console.error(`  High confidence (≥0.9): ${highConfidence}`);
  console.error(`  Medium confidence (0.7-0.9): ${mediumConfidence}`);
  console.error(`  Low confidence (<0.7): ${lowConfidence}`);

  // Write output
  const output = {
    metadata: {
      snapshotAt: new Date().toISOString(),
      totalClaims: snapshots.length,
      successfulFetches: successful,
      failedFetches: failed,
      durationSeconds: parseFloat(duration)
    },
    snapshots
  };

  fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
  console.error(`\nWritten to: ${outputFile}`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
