#!/usr/bin/env node

/**
 * Add map links to inline addresses in Resource guide.md
 * Addresses appear in prose text, parentheses, and tables
 */

const fs = require('fs');
const https = require('https');

const DELAY_MS = 1000;
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const SLO_COUNTY_BOUNDS = {
  minLat: 35.0,
  maxLat: 35.7,
  minLon: -121.1,
  maxLon: -120.4
};

async function geocode(address) {
  return new Promise((resolve, reject) => {
    const query = encodeURIComponent(address + ', San Luis Obispo County, California');
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`;

    https.get(url, {
      headers: {
        'User-Agent': 'SLO-Homeless-Resource-Guide/1.0'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const results = JSON.parse(data);
          if (results.length > 0) {
            resolve({
              lat: parseFloat(results[0].lat),
              lon: parseFloat(results[0].lon),
              display_name: results[0].display_name
            });
          } else {
            resolve(null);
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function isInSLOCounty(lat, lon) {
  return lat >= SLO_COUNTY_BOUNDS.minLat &&
         lat <= SLO_COUNTY_BOUNDS.maxLat &&
         lon >= SLO_COUNTY_BOUNDS.minLon &&
         lon <= SLO_COUNTY_BOUNDS.maxLon;
}

function createMapLink(lat, lon, addressText, label, zoom = 17) {
  return `<a href="#" class="map-link" data-lat="${lat.toFixed(6)}" data-lon="${lon.toFixed(6)}" data-zoom="${zoom}" data-label="${label}">${addressText}</a>`;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function processResourceGuide() {
  console.log('Reading Resource guide.md for inline addresses...');
  let content = fs.readFileSync('/home/dgross/ResourceGuide/Resource guide.md', 'utf-8');
  const originalContent = content;

  // Pattern to match addresses like "123 Street Name St., City" or "123 Street Name St. in City"
  // We want to capture the full address with city context
  const addressPattern = /(\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:St\.|Street|Ave\.|Avenue|Rd\.|Road|Dr\.|Drive|Blvd\.|Boulevard|Ln\.|Lane))(?:,\s*|\s+in\s+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g;

  const matches = [];
  let match;

  while ((match = addressPattern.exec(content)) !== null) {
    const street = match[1];
    const city = match[2];
    const fullMatch = match[0];
    const index = match.index;

    matches.push({
      fullMatch,
      street,
      city,
      index
    });
  }

  console.log(`Found ${matches.length} potential addresses\n`);

  let successCount = 0;
  let failedCount = 0;
  const replacements = [];

  for (const addrMatch of matches) {
    // Skip if already has a map link nearby
    const contextStart = Math.max(0, addrMatch.index - 100);
    const contextEnd = Math.min(content.length, addrMatch.index + addrMatch.fullMatch.length + 100);
    const context = content.substring(contextStart, contextEnd);

    if (context.includes('class="map-link"')) {
      console.log(`Skipping (already has map link): ${addrMatch.fullMatch}`);
      continue;
    }

    const fullAddress = `${addrMatch.street}, ${addrMatch.city}`;
    console.log(`\n[${addrMatch.index}] ${fullAddress}`);

    try {
      await sleep(DELAY_MS);
      const coords = await geocode(fullAddress);

      if (coords && isInSLOCounty(coords.lat, coords.lon)) {
        console.log(`  ✓ ${coords.lat.toFixed(6)}, ${coords.lon.toFixed(6)}`);

        const label = `${addrMatch.street}, ${addrMatch.city}`;
        const mapLink = createMapLink(coords.lat, coords.lon, addrMatch.fullMatch, label);

        replacements.push({
          oldText: addrMatch.fullMatch,
          newText: mapLink,
          address: fullAddress
        });

        successCount++;
      } else if (coords) {
        console.log(`  ✗ Outside SLO County`);
        failedCount++;
      } else {
        console.log(`  ✗ Not found`);
        failedCount++;
      }
    } catch (error) {
      console.log(`  ✗ Error: ${error.message}`);
      failedCount++;
    }
  }

  // Apply replacements - need to be careful about overlapping matches
  console.log(`\n\nApplying ${replacements.length} replacements...`);

  // Sort by index (reverse) so we don't mess up positions
  replacements.sort((a, b) => {
    // Find index in original content
    const aIndex = originalContent.indexOf(a.oldText);
    const bIndex = originalContent.indexOf(b.oldText);
    return bIndex - aIndex;
  });

  let appliedCount = 0;
  for (const { oldText, newText, address } of replacements) {
    // Only replace if the text still exists (hasn't been replaced by a longer match)
    if (content.includes(oldText)) {
      // Replace only the first occurrence to be safe
      const regex = new RegExp(escapeRegex(oldText));
      const newContent = content.replace(regex, newText);

      if (newContent !== content) {
        content = newContent;
        appliedCount++;
        console.log(`  ✓ Applied: ${address}`);
      }
    } else {
      console.log(`  ⊘ Skipped (already replaced): ${address}`);
    }
  }

  // Write the file
  if (content !== originalContent) {
    fs.writeFileSync('/home/dgross/ResourceGuide/Resource guide.md', content);
    console.log(`\nFile written with ${appliedCount} changes.`);
  } else {
    console.log(`\nNo changes made to file.`);
  }

  console.log('\n=== SUMMARY ===');
  console.log(`Successfully geocoded: ${successCount}`);
  console.log(`Successfully applied to file: ${appliedCount}`);
  console.log(`Failed to geocode: ${failedCount}`);
  console.log(`Total attempted: ${matches.length}`);
}

processResourceGuide().catch(console.error);
