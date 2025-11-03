#!/usr/bin/env node

/**
 * Add map links to addresses in bulleted lists (e.g., Little Free Libraries)
 * Only processes specific sections and validates addresses
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

// Only process these sections
const ALLOWED_SECTIONS = [
  'Little Free Libraries',
  'Little Free Pantries'
];

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

function looksLikeAddress(text) {
  // Must contain a number
  if (!/\d/.test(text)) {
    return false;
  }

  // Skip things that are clearly not addresses
  if (text.match(/^(M–|Tu–|W–|Th–|F–|Sa–|Su–)/i)) return false;  // Hours
  if (text.match(/^\[?\d{3}[-\s]\d{3}[-\s]\d{4}/)) return false;  // Phone numbers
  if (text.match(/^(Hours|Phone|Email|Notes?):/i)) return false;
  if (text.startsWith('[') && text.includes('](tel:')) return false;  // Markdown phone links

  // Good signs it's an address
  if (text.match(/\b(St\.|Street|Ave\.|Avenue|Rd\.|Road|Dr\.|Drive|Blvd\.|Boulevard|Ln\.|Lane|Way|Court|Ct\.|Place|Pl\.)\b/i)) {
    return true;
  }

  // Address number patterns
  if (text.match(/^\d+\s+[A-Z]/)) return true;  // "330 Alder"
  if (text.match(/^\d+[A-Z]?\s+(N\.|S\.|E\.|W\.)?\s*\d+/i)) return true;  // "338 N. 3rd"
  if (text.match(/corner of/i)) return true;  // "Corner of Cedar & Boysenberry"

  return false;
}

function createMapLink(lat, lon, label, zoom = 17) {
  return `<a href="#" class="map-link" data-lat="${lat.toFixed(6)}" data-lon="${lon.toFixed(6)}" data-zoom="${zoom}" data-label="${label}">📍 Map</a>`;
}

async function processListItems() {
  console.log('Reading Directory.md for list items...');
  let content = fs.readFileSync('/home/dgross/ResourceGuide/Directory.md', 'utf-8');
  const lines = content.split('\n');

  let currentCity = null;
  let currentSection = null;
  let inAllowedSection = false;
  let successCount = 0;
  let failedCount = 0;
  let skippedCount = 0;

  const modifications = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track current section
    if (line.match(/^## <a id="([^"]+)">/)) {
      const match = line.match(/^## <a id="[^"]+">([^<]+)</);
      currentSection = match ? match[1].trim() : null;
      inAllowedSection = ALLOWED_SECTIONS.includes(currentSection);
      currentCity = null;
      console.log(`\n=== Section: ${currentSection} (${inAllowedSection ? 'PROCESSING' : 'SKIPPING'}) ===`);
      continue;
    }

    // Only process allowed sections
    if (!inAllowedSection) {
      continue;
    }

    // Track current city in nested lists (e.g., "   - Arroyo Grande:")
    if (line.match(/^\s{3}- ([^:]+):$/)) {
      const match = line.match(/^\s{3}- ([^:]+):$/);
      currentCity = match[1].trim();
      continue;
    }

    // Find list items with addresses that don't have map links
    // Pattern: 6 spaces, dash, space, then text
    if (line.match(/^\s{6}- .+/) && !line.includes('class="map-link"')) {
      const match = line.match(/^\s{6}- (.+)$/);
      if (!match) continue;

      const addressPart = match[1].trim();

      // Validate it looks like an address
      if (!looksLikeAddress(addressPart)) {
        skippedCount++;
        continue;
      }

      // Build full address with city context
      let fullAddress = addressPart;
      if (currentCity) {
        fullAddress = `${addressPart}, ${currentCity}, California`;
      } else {
        fullAddress = `${addressPart}, San Luis Obispo County, California`;
      }

      console.log(`\n[Line ${i+1}] ${addressPart}`);
      if (currentCity) {
        console.log(`  City: ${currentCity}`);
      }

      try {
        await sleep(DELAY_MS);
        const coords = await geocode(fullAddress);

        if (coords && isInSLOCounty(coords.lat, coords.lon)) {
          console.log(`  ✓ ${coords.lat.toFixed(6)}, ${coords.lon.toFixed(6)}`);

          const label = currentSection || 'Location';
          const mapLink = ` ${createMapLink(coords.lat, coords.lon, label)}`;

          modifications.push({
            lineIndex: i,
            oldLine: line,
            newLine: line + mapLink
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
  }

  // Apply modifications in reverse order
  console.log(`\n\nApplying ${modifications.length} modifications...`);
  for (const mod of modifications.reverse()) {
    lines[mod.lineIndex] = mod.newLine;
  }

  // Write the file
  if (modifications.length > 0) {
    const newContent = lines.join('\n');
    fs.writeFileSync('/home/dgross/ResourceGuide/Directory.md', newContent);
    console.log(`File written.`);
  }

  console.log('\n=== SUMMARY ===');
  console.log(`Successfully added: ${successCount}`);
  console.log(`Failed to geocode: ${failedCount}`);
  console.log(`Skipped (not addresses): ${skippedCount}`);
  console.log(`Total attempted: ${successCount + failedCount}`);
}

processListItems().catch(console.error);
