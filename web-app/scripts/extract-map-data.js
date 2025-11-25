#!/usr/bin/env node

/**
 * Extract Little Free Library and Pantry coordinates from Directory.md
 * and generate JavaScript data files for use in map pages
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const DIRECTORY_MD = path.join(__dirname, '../../Directory.md');
const OUTPUT_DIR = path.join(__dirname, '../public');
const LIBRARIES_JS = path.join(OUTPUT_DIR, 'little-free-libraries-data.js');
const PANTRIES_JS = path.join(OUTPUT_DIR, 'little-free-pantries-data.js');

/**
 * Extract coordinates from markdown content for a specific section
 */
function extractCoordinates(content, sectionId, label) {
  const locations = [];

  // Find the section
  const sectionRegex = new RegExp(`## <a id="${sectionId}">.*?</a>`, 'i');
  const sectionMatch = content.match(sectionRegex);

  if (!sectionMatch) {
    console.error(`Section ${sectionId} not found`);
    return locations;
  }

  const sectionStart = sectionMatch.index;

  // Find the next section (to know where this section ends)
  const nextSectionRegex = /^## <a id="[^"]+">.*?<\/a>/gm;
  nextSectionRegex.lastIndex = sectionStart + sectionMatch[0].length;
  const nextSectionMatch = nextSectionRegex.exec(content);

  const sectionEnd = nextSectionMatch ? nextSectionMatch.index : content.length;
  const sectionContent = content.substring(sectionStart, sectionEnd);

  // Extract all map links with coordinates
  const mapLinkRegex = /<a[^>]*class="map-link"[^>]*data-lat="([^"]+)"[^>]*data-lon="([^"]+)"[^>]*data-zoom="([^"]+)"[^>]*data-label="([^"]+)"[^>]*>([^<]+)<\/a>/g;

  let match;
  while ((match = mapLinkRegex.exec(sectionContent)) !== null) {
    const [, lat, lon, zoom, dataLabel, linkText] = match;

    // Extract address from the line - look backwards for the address text
    const lineStart = sectionContent.lastIndexOf('\n', match.index);
    const lineContent = sectionContent.substring(lineStart, match.index);

    // The address is usually between "- " and " <a href"
    const addressMatch = lineContent.match(/[-•]\s*(.+?)$/);
    const address = addressMatch ? addressMatch[1].trim() : linkText;

    locations.push({
      lat: parseFloat(lat),
      lon: parseFloat(lon),
      zoom: parseInt(zoom),
      label: address
    });
  }

  return locations;
}

/**
 * Generate JavaScript data file
 */
function generateDataFile(locations, filename, mapId, markerIcon) {
  const jsContent = `// Auto-generated from Directory.md - DO NOT EDIT MANUALLY
// Run 'npm run extract-map-data' to regenerate this file

export const locations = ${JSON.stringify(locations, null, 2)};

export const config = {
  mapId: '${mapId}',
  center: [35.2828, -120.6596], // SLO County center
  defaultZoom: 10,
  markerIcon: '${markerIcon}'
};
`;

  fs.writeFileSync(filename, jsContent, 'utf8');
  console.log(`✓ Generated ${path.basename(filename)} with ${locations.length} locations`);
}

/**
 * Main execution
 */
function main() {
  console.log('Extracting map data from Directory.md...\n');

  // Read Directory.md
  const content = fs.readFileSync(DIRECTORY_MD, 'utf8');

  // Extract libraries
  const libraries = extractCoordinates(content, 'Little-Free-Libraries', 'Little Free Library');
  generateDataFile(libraries, LIBRARIES_JS, 'little-free-libraries-map', 'blue');

  // Extract pantries
  const pantries = extractCoordinates(content, 'Little-Free-Pantries', 'Little Free Pantry');
  generateDataFile(pantries, PANTRIES_JS, 'little-free-pantries-map', 'orange');

  console.log('\n✓ Map data extraction complete!');
  console.log('  Map HTML files can now import these data files.');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
