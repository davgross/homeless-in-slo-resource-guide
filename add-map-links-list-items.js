#!/usr/bin/env node

/**
 * Add map links to addresses in bulleted lists (e.g., Little Free Libraries)
 * These are formatted as nested list items under city headings
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

function createMapLink(lat, lon, label, zoom = 17) {
  return `<a href="#" class="map-link" data-lat="${lat.toFixed(6)}" data-lon="${lon.toFixed(6)}" data-zoom="${zoom}" data-label="${label}">📍 Map</a>`;
}

async function processListItems() {
  console.log('Reading Directory.md for list items...');
  let content = fs.readFileSync('/home/dgross/ResourceGuide/Directory.md', 'utf-8');
  const lines = content.split('\n');

  let currentCity = null;
  let currentSection = null;
  let modified = false;
  let successCount = 0;
  let failedCount = 0;
  let skippedCount = 0;

  // Track which lines to modify
  const modifications = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track current section
    if (line.match(/^## <a id="([^"]+)">/)) {
      const match = line.match(/^## <a id="[^"]+">([^<]+)</);
      currentSection = match ? match[1].trim() : null;
      currentCity = null;
      continue;
    }

    // Track current city in nested lists (e.g., "   - Arroyo Grande:")
    if (line.match(/^\s{3}- ([^:]+):$/)) {
      const match = line.match(/^\s{3}- ([^:]+):$/);
      currentCity = match[1].trim();
      continue;
    }

    // Find list items with addresses that don't have map links
    // Pattern: starts with spaces, dash, space, then likely an address
    if (line.match(/^\s{6}- .+/) && !line.includes('class="map-link"')) {
      // Extract the address part (everything after "- ")
      const match = line.match(/^\s{6}- (.+)$/);
      if (!match) continue;

      const addressPart = match[1].trim();

      // Skip if it's not an address (e.g., "Hours: Daily, 24/7" or descriptive text)
      if (addressPart.match(/^(Hours|Phone|Email|Notes?):/i)) {
        continue;
      }

      // Skip very vague locations
      if (addressPart.match(/^(various|county-wide|multiple|mobile|throughout)/i)) {
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

      console.log(`\n[Line ${i+1}] Processing: ${addressPart}`);
      if (currentCity) {
        console.log(`  City context: ${currentCity}`);
      }
      console.log(`  Full query: ${fullAddress}`);

      try {
        await sleep(DELAY_MS);
        const coords = await geocode(fullAddress);

        if (coords && isInSLOCounty(coords.lat, coords.lon)) {
          console.log(`  ✓ Found: ${coords.lat.toFixed(6)}, ${coords.lon.toFixed(6)}`);

          const label = currentSection || 'Location';
          const mapLink = ` ${createMapLink(coords.lat, coords.lon, label)}`;

          // Store the modification
          modifications.push({
            lineIndex: i,
            oldLine: line,
            newLine: line + mapLink
          });

          successCount++;
        } else if (coords) {
          console.log(`  ✗ Outside SLO County: ${coords.lat.toFixed(6)}, ${coords.lon.toFixed(6)}`);
          failedCount++;
        } else {
          console.log(`  ✗ Not found by geocoder`);
          failedCount++;
        }
      } catch (error) {
        console.log(`  ✗ Error: ${error.message}`);
        failedCount++;
      }
    }
  }

  // Apply modifications in reverse order (so line numbers stay valid)
  console.log(`\n\nApplying ${modifications.length} modifications...`);
  for (const mod of modifications.reverse()) {
    lines[mod.lineIndex] = mod.newLine;
  }

  // Write the file
  if (modifications.length > 0) {
    const newContent = lines.join('\n');
    fs.writeFileSync('/home/dgross/ResourceGuide/Directory.md', newContent);
    console.log(`File written with ${modifications.length} changes.`);
  } else {
    console.log(`No changes made to file.`);
  }

  console.log('\n=== LIST ITEMS SUMMARY ===');
  console.log(`Successfully added: ${successCount}`);
  console.log(`Failed to geocode: ${failedCount}`);
  console.log(`Skipped (vague/descriptive): ${skippedCount}`);
  console.log(`Total processed: ${successCount + failedCount + skippedCount}`);
}

processListItems().catch(console.error);
