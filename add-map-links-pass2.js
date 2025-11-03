#!/usr/bin/env node

/**
 * Second pass: Retry addresses that failed in first pass
 * - Strip unit/suite/room numbers
 * - Expand SLO County bounds to include Paso Robles
 */

const fs = require('fs');
const https = require('https');

const DELAY_MS = 1000;
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Expanded bounds to include all of SLO County including Paso Robles
const SLO_COUNTY_BOUNDS = {
  minLat: 35.0,
  maxLat: 35.7,  // Paso Robles is around 35.62
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

function stripUnitNumbers(address) {
  return address
    // Remove suite/unit/room numbers: #123, Suite 123, etc.
    .replace(/\s*#\d+[A-Za-z]?/g, '')
    .replace(/\s+Suite\s+[A-Za-z0-9-]+/gi, '')
    .replace(/\s+Unit\s+[A-Za-z0-9-]+/gi, '')
    .replace(/\s+Room\s+[A-Za-z0-9-]+/gi, '')
    .replace(/\s+Ste\.?\s+[A-Za-z0-9-]+/gi, '')
    .replace(/\s+Bldg\.?\s+[A-Za-z0-9-]+/gi, '')
    // Remove trailing letters from street numbers: 667A -> 667
    .replace(/(\d+)[A-Za-z]\s+/g, '$1 ')
    // Clean up extra spaces
    .replace(/\s+/g, ' ')
    .trim();
}

function createMapLink(lat, lon, label, zoom = 17) {
  return `<a class="map-link" data-lat="${lat.toFixed(6)}" data-lon="${lon.toFixed(6)}" data-zoom="${zoom}" data-label="${label}">📍 Map</a>`;
}

async function processSecondPass() {
  console.log('Reading Directory.md for second pass...');
  const content = fs.readFileSync('/home/dgross/ResourceGuide/Directory.md', 'utf-8');

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

  let modified = false;
  let successCount = 0;
  let stillFailedCount = 0;

  // Process each to-do
  for (const todo of todos) {
    const originalAddress = todo.address;
    const strippedAddress = stripUnitNumbers(originalAddress);

    console.log(`\nRetrying: ${originalAddress}`);
    if (strippedAddress !== originalAddress) {
      console.log(`  Stripped to: ${strippedAddress}`);
    }

    try {
      await sleep(DELAY_MS);
      const coords = await geocode(strippedAddress);

      if (coords && isInSLOCounty(coords.lat, coords.lon)) {
        console.log(`  ✓ Found: ${coords.lat.toFixed(6)}, ${coords.lon.toFixed(6)}`);

        // Find the organization name for this entry
        // Look backwards from the to-do comment to find the nearest ## header
        const beforeTodo = content.substring(0, todo.index);
        const headerMatch = beforeTodo.match(/##\s*(?:<a id="[^"]*">)?([^<\n]+?)(?:<\/a>)?[\s]*$/m);
        const orgName = headerMatch ? headerMatch[1].trim() : 'Location';

        // Create the map link
        const mapLink = ` ${createMapLink(coords.lat, coords.lon, orgName)}`;

        // Find the Location line before this to-do comment
        const locationMatch = beforeTodo.match(/(- Location:[^\n]*)\n<!-- To-do: Add map link/);

        if (locationMatch) {
          const locationLine = locationMatch[1];
          const replacement = locationLine + mapLink;

          // Replace in content: remove the to-do comment and add map link to location line
          const pattern = new RegExp(
            locationLine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
            '\\s*\\n' +
            todo.fullMatch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
            'g'
          );

          const newContent = content.replace(pattern, replacement);

          if (newContent !== content) {
            fs.writeFileSync('/home/dgross/ResourceGuide/Directory.md', newContent);
            // Re-read for next iteration
            content = newContent;
            modified = true;
            successCount++;
          }
        }
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

  console.log('\n\n=== SECOND PASS SUMMARY ===');
  console.log(`Successfully added: ${successCount}`);
  console.log(`Still need human review: ${stillFailedCount}`);
  console.log(`Total attempted: ${todos.length}`);
}

processSecondPass().catch(console.error);
