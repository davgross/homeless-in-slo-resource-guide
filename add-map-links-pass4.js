#!/usr/bin/env node

/**
 * Fourth pass: Fixed file replacement logic
 * - Reads file once, makes all replacements in memory, writes once
 * - Expands "SLO" to "San Luis Obispo"
 * - Adds ", California" for better geocoding
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

function cleanAddress(address) {
  let cleaned = address;

  // Strip unit/suite/room numbers
  cleaned = cleaned
    .replace(/\s*#\d+[A-Za-z]?/g, '')
    .replace(/\s+Suite\s+[A-Za-z0-9-]+/gi, '')
    .replace(/\s+Unit\s+[A-Za-z0-9-]+/gi, '')
    .replace(/\s+Room\s+[A-Za-z0-9-]+/gi, '')
    .replace(/\s+Ste\.?\s+[A-Za-z0-9-]+/gi, '')
    .replace(/\s+Bldg\.?\s+[A-Za-z0-9-]+/gi, '')
    .replace(/(\d+)[A-Za-z]\s+/g, '$1 ');

  // Expand "SLO" to "San Luis Obispo"
  cleaned = cleaned.replace(/,?\s+SLO\s*$/i, ', San Luis Obispo');
  cleaned = cleaned.replace(/,?\s+SLO\s*([,\(])/gi, ', San Luis Obispo$1');

  // Add ", California" if not already present
  if (!/California|CA\s*$/i.test(cleaned)) {
    if (/\w+\s*$/.test(cleaned) && !/County|campus|park|center|building/i.test(cleaned)) {
      cleaned = cleaned + ', California';
    }
  }

  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned;
}

function createMapLink(lat, lon, label, zoom = 17) {
  return `<a class="map-link" data-lat="${lat.toFixed(6)}" data-lon="${lon.toFixed(6)}" data-zoom="${zoom}" data-label="${label}">📍 Map</a>`;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function processFourthPass() {
  console.log('Reading Directory.md for fourth pass...');
  let content = fs.readFileSync('/home/dgross/ResourceGuide/Directory.md', 'utf-8');
  const originalContent = content;

  // Find all to-do comments with addresses
  const todoRegex = /<!-- To-do: Add map link for "([^"]+)" - ([^>]+) -->/g;
  const todos = [];
  let match;

  while ((match = todoRegex.exec(content)) !== null) {
    todos.push({
      fullMatch: match[0],
      address: match[1],
      reason: match[2],
      index: match.index
    });
  }

  console.log(`Found ${todos.length} to-do items to retry\n`);

  let successCount = 0;
  let stillFailedCount = 0;

  // Store all replacements to make
  const replacements = [];

  // Process each to-do
  for (const todo of todos) {
    const originalAddress = todo.address;
    const cleanedAddress = cleanAddress(originalAddress);

    console.log(`\nRetrying: ${originalAddress}`);
    if (cleanedAddress !== originalAddress) {
      console.log(`  Cleaned to: ${cleanedAddress}`);
    }

    try {
      await sleep(DELAY_MS);
      const coords = await geocode(cleanedAddress);

      if (coords && isInSLOCounty(coords.lat, coords.lon)) {
        console.log(`  ✓ Found: ${coords.lat.toFixed(6)}, ${coords.lon.toFixed(6)}`);

        // Find the organization name for this entry
        const beforeTodo = content.substring(0, todo.index);
        const headerMatch = beforeTodo.match(/##\s*(?:<a id="[^"]*">)?([^<\n]+?)(?:<\/a>)?[\s]*$/m);
        const orgName = headerMatch ? headerMatch[1].trim() : 'Location';

        // Create the map link
        const mapLink = ` ${createMapLink(coords.lat, coords.lon, orgName)}`;

        // Look for the Location line immediately before the to-do comment
        // The pattern should be: "- Location: XXXX\n<!-- To-do:"
        const locationPattern = new RegExp(
          `(- Location:[^\\n]+)\\s*\\n${escapeRegex(todo.fullMatch)}`,
          'g'
        );

        // Store this replacement
        replacements.push({
          pattern: locationPattern,
          replacement: `$1${mapLink}`,
          address: originalAddress
        });

        successCount++;
      } else if (coords) {
        console.log(`  ✗ Outside SLO County: ${coords.lat.toFixed(6)}, ${coords.lon.toFixed(6)}`);
        stillFailedCount++;
      } else {
        console.log(`  ✗ Still not found by geocoder`);
        stillFailedCount++;
      }
    } catch (error) {
      console.log(`  ✗ Error: ${error.message}`);
      stillFailedCount++;
    }
  }

  // Now apply all replacements
  console.log(`\n\nApplying ${replacements.length} replacements...`);
  let appliedCount = 0;

  for (const { pattern, replacement, address } of replacements) {
    const newContent = content.replace(pattern, replacement);
    if (newContent !== content) {
      content = newContent;
      appliedCount++;
      console.log(`  ✓ Applied: ${address}`);
    } else {
      console.log(`  ✗ Failed to apply: ${address}`);
    }
  }

  // Write the file
  if (content !== originalContent) {
    fs.writeFileSync('/home/dgross/ResourceGuide/Directory.md', content);
    console.log(`\nFile written with ${appliedCount} changes.`);
  } else {
    console.log(`\nNo changes made to file.`);
  }

  console.log('\n=== FOURTH PASS SUMMARY ===');
  console.log(`Successfully geocoded: ${successCount}`);
  console.log(`Successfully applied to file: ${appliedCount}`);
  console.log(`Still need human review: ${stillFailedCount}`);
  console.log(`Total attempted: ${todos.length}`);
}

processFourthPass().catch(console.error);
