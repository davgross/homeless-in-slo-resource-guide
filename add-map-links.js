#!/usr/bin/env node

/**
 * Script to add map links to Directory.md entries
 * Uses OpenStreetMap Nominatim API for geocoding
 */

const fs = require('fs');
const https = require('https');

// Rate limiting
const DELAY_MS = 1000; // 1 second between API calls
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Geocode an address using Nominatim
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

// Extract location from a directory entry
function extractLocation(entryText) {
  const locationMatch = entryText.match(/^[\s]*-\s*Location:\s*([^\n<]+?)(?:\s*<a class="map-link"|$)/m);
  if (!locationMatch) return null;

  const location = locationMatch[1].trim();

  // Skip P.O. Boxes
  if (/P\.?O\.?\s*Box/i.test(location)) return null;

  // Skip vague locations
  if (/^(County-wide|Various|Mobile|SLO County|Throughout)/i.test(location)) return null;

  return location;
}

// Check if entry already has a map link on the Location line
function hasMapLink(entryText) {
  return /Location:.*<a class="map-link"/.test(entryText);
}

// Create map link HTML
function createMapLink(lat, lon, label, zoom = 17) {
  return `<a class="map-link" data-lat="${lat.toFixed(6)}" data-lon="${lon.toFixed(6)}" data-zoom="${zoom}" data-label="${label}">📍 Map</a>`;
}

// Extract organization name from entry
function extractOrgName(entryText) {
  const match = entryText.match(/^##\s*(?:<a id="[^"]*">)?([^<\n]+)/m);
  return match ? match[1].trim() : 'Location';
}

// Main processing function
async function processDirectory() {
  console.log('Reading Directory.md...');
  const content = fs.readFileSync('/home/dgross/ResourceGuide/Directory.md', 'utf-8');

  // Split into entries by ## headers
  const entries = content.split(/(?=^## )/m);

  let modified = false;
  let addedCount = 0;
  let todoCount = 0;
  let skippedCount = 0;

  const results = [];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    // Skip if not a directory entry (e.g., the header)
    if (!entry.match(/^## /m)) {
      results.push(entry);
      continue;
    }

    const orgName = extractOrgName(entry);
    console.log(`\nProcessing: ${orgName}`);

    // Check if already has map link
    if (hasMapLink(entry)) {
      console.log('  ✓ Already has map link');
      results.push(entry);
      skippedCount++;
      continue;
    }

    // Extract location
    const location = extractLocation(entry);
    if (!location) {
      console.log('  - No physical address found');
      results.push(entry);
      skippedCount++;
      continue;
    }

    console.log(`  Location: ${location}`);

    // Try to geocode
    try {
      await sleep(DELAY_MS); // Rate limiting
      const coords = await geocode(location);

      if (coords) {
        // Verify it's in SLO County (roughly)
        if (coords.lat >= 35.0 && coords.lat <= 35.6 &&
            coords.lon >= -121.0 && coords.lon <= -120.4) {

          console.log(`  ✓ Found: ${coords.lat.toFixed(6)}, ${coords.lon.toFixed(6)}`);

          // Add map link after the location
          const mapLink = createMapLink(coords.lat, coords.lon, orgName);
          const updatedEntry = entry.replace(
            /^([\s]*-\s*Location:\s*[^\n<]+?)(\s*$)/m,
            `$1 ${mapLink}$2`
          );

          results.push(updatedEntry);
          modified = true;
          addedCount++;
        } else {
          console.log(`  ✗ Outside SLO County: ${coords.lat}, ${coords.lon}`);
          // Add to-do comment
          const todoComment = `\n<!-- To-do: Verify location for "${location}" - geocoded outside expected bounds -->`;
          const updatedEntry = entry.replace(
            /^([\s]*-\s*Location:\s*[^\n]+)$/m,
            `$1${todoComment}`
          );
          results.push(updatedEntry);
          todoCount++;
        }
      } else {
        console.log('  ✗ Not found by geocoder');
        // Add to-do comment
        const todoComment = `\n<!-- To-do: Add map link for "${location}" - could not geocode automatically -->`;
        const updatedEntry = entry.replace(
          /^([\s]*-\s*Location:\s*[^\n]+)$/m,
          `$1${todoComment}`
        );
        results.push(updatedEntry);
        todoCount++;
      }
    } catch (error) {
      console.log(`  ✗ Error: ${error.message}`);
      results.push(entry);
      skippedCount++;
    }
  }

  if (modified) {
    console.log('\n\nWriting updated Directory.md...');
    fs.writeFileSync('/home/dgross/ResourceGuide/Directory.md', results.join(''));
    console.log('Done!');
  } else {
    console.log('\n\nNo changes made.');
  }

  console.log('\n=== SUMMARY ===');
  console.log(`Map links added: ${addedCount}`);
  console.log(`To-do comments added: ${todoCount}`);
  console.log(`Skipped (already done or no address): ${skippedCount}`);
  console.log(`Total entries processed: ${entries.length - 1}`); // -1 for header
}

// Run
processDirectory().catch(console.error);
