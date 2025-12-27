#!/usr/bin/env node

/**
 * Extract Little Free Library and Pantry coordinates from Directory.md
 * and Naloxone locations from Resource guide.md
 * and generate JavaScript data files for use in map pages
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const DIRECTORY_MD = path.join(__dirname, '../../Directory.md');
const RESOURCE_GUIDE_MD = path.join(__dirname, '../../Resource guide.md');
const OUTPUT_DIR = path.join(__dirname, '../public');
const LIBRARIES_JS = path.join(OUTPUT_DIR, 'little-free-libraries-data.js');
const PANTRIES_JS = path.join(OUTPUT_DIR, 'little-free-pantries-data.js');
const NALOXONE_JS = path.join(OUTPUT_DIR, 'naloxone-locations-data.js');

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

  // Split content by lines to track city names
  const lines = sectionContent.split('\n');
  let currentCity = '';

  // Extract all map links with coordinates
  const mapLinkRegex = /<a[^>]*class="map-link"[^>]*data-lat="([^"]+)"[^>]*data-lon="([^"]+)"[^>]*data-zoom="([^"]+)"[^>]*data-label="([^"]+)"[^>]*>([^<]+)<\/a>/g;

  let match;
  while ((match = mapLinkRegex.exec(sectionContent)) !== null) {
    const [, lat, lon, zoom, dataLabel, linkText] = match;

    // Find the line containing this match to extract city name
    const lineStart = sectionContent.lastIndexOf('\n', match.index);
    const prevNewlines = sectionContent.substring(0, lineStart).split('\n').length;

    // Look backwards through recent lines to find the city name (format: "   - CityName:")
    for (let i = prevNewlines - 1; i >= 0 && i < lines.length; i--) {
      const cityMatch = lines[i].match(/^\s{3}-\s+([^:]+):\s*$/);
      if (cityMatch) {
        currentCity = cityMatch[1].trim();
        break;
      }
      // Stop if we hit another section marker or the beginning
      if (lines[i].match(/^[-#]/) && !lines[i].match(/^\s{3,}/)) {
        break;
      }
    }

    // Use the address from the link text
    const address = linkText.trim();

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
 * Extract naloxone location coordinates from Resource guide.md
 * This has a different format - it's a ### section with inline map links
 */
function extractNaloxoneLocations(content) {
  const locations = [];

  // Find the naloxone section (it's a ### section)
  const sectionRegex = /### <a id="naloxone-narcan">Naloxone \/ Narcan<\/a>/i;
  const sectionMatch = content.match(sectionRegex);

  if (!sectionMatch) {
    console.error('Naloxone / Narcan section not found');
    return locations;
  }

  const sectionStart = sectionMatch.index;

  // Find the next ### section (to know where this section ends)
  const nextSectionRegex = /^### <a id="[^"]+">.*?<\/a>/gm;
  nextSectionRegex.lastIndex = sectionStart + sectionMatch[0].length;
  const nextSectionMatch = nextSectionRegex.exec(content);

  const sectionEnd = nextSectionMatch ? nextSectionMatch.index : content.length;
  const sectionContent = content.substring(sectionStart, sectionEnd);

  // Extract all map links with coordinates
  const mapLinkRegex = /<a[^>]*class="map-link"[^>]*data-lat="([^"]+)"[^>]*data-lon="([^"]+)"[^>]*data-zoom="([^"]+)"[^>]*data-label="([^"]+)"[^>]*>/g;

  let match;
  while ((match = mapLinkRegex.exec(sectionContent)) !== null) {
    const [fullMatch, lat, lon, zoom, dataLabel] = match;

    // Extract location name and address from the line
    // Format is usually: "- Location: address, <a href..."
    const lineStart = sectionContent.lastIndexOf('\n', match.index);
    const lineEnd = sectionContent.indexOf('\n', match.index);
    const lineContent = sectionContent.substring(lineStart, lineEnd);

    // Helper function to clean markdown from text
    const cleanMarkdown = (text) => {
      return text
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // Remove links [text](url) -> text
        .replace(/\*\*([^*]+)\*\*/g, '$1')        // Remove bold **text** -> text
        .replace(/\s+/g, ' ')                      // Normalize whitespace
        .trim();
    };

    // Try to extract location name and address
    // Look for patterns like "- Name: address," or "- [**Name**]: address,"
    let locationName = dataLabel;
    let address = '';

    // Match pattern like "- SomeName: address, <a href"
    const patternMatch = lineContent.match(/[-•]\s*([^:]+):\s*([^,<]+)/);
    if (patternMatch) {
      locationName = cleanMarkdown(patternMatch[1]);
      address = cleanMarkdown(patternMatch[2]);
    } else {
      // Try to extract just the address before the link
      const addressMatch = lineContent.match(/[-•]\s*([^<]+)<a/);
      if (addressMatch) {
        const fullText = cleanMarkdown(addressMatch[1]);
        // Split on comma to separate location from address
        const parts = fullText.split(',');
        if (parts.length >= 2) {
          locationName = parts[0].trim();
          address = parts.slice(1).join(',').trim();
        } else {
          address = fullText;
        }
      }
    }

    // Combine name and address for the label
    const label = address ? `${locationName}, ${address}` : locationName;

    locations.push({
      lat: parseFloat(lat),
      lon: parseFloat(lon),
      zoom: parseInt(zoom),
      label: label
    });
  }

  return locations;
}

/**
 * Generate JavaScript data file
 */
function generateDataFile(locations, filename, mapId, markerIcon, sourceFile = 'Directory.md') {
  const jsContent = `// Auto-generated from ${sourceFile} - DO NOT EDIT MANUALLY
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
  console.log('Extracting map data from markdown files...\n');

  // Read Directory.md
  const directoryContent = fs.readFileSync(DIRECTORY_MD, 'utf8');

  // Extract libraries
  const libraries = extractCoordinates(directoryContent, 'Little-Free-Libraries', 'Little Free Library');
  generateDataFile(libraries, LIBRARIES_JS, 'little-free-libraries-map', 'blue', 'Directory.md');

  // Extract pantries
  const pantries = extractCoordinates(directoryContent, 'Little-Free-Pantries', 'Little Free Pantry');
  generateDataFile(pantries, PANTRIES_JS, 'little-free-pantries-map', 'orange', 'Directory.md');

  // Read Resource guide.md
  const resourceGuideContent = fs.readFileSync(RESOURCE_GUIDE_MD, 'utf8');

  // Extract naloxone locations
  const naloxoneLocations = extractNaloxoneLocations(resourceGuideContent);
  generateDataFile(naloxoneLocations, NALOXONE_JS, 'naloxone-locations-map', 'red', 'Resource guide.md');

  console.log('\n✓ Map data extraction complete!');
  console.log('  Map HTML files can now import these data files.');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
