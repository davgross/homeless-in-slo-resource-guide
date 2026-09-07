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
const OUTPUT_DIR = path.join(__dirname, '../public');

// The map pages are reachable from both guides, so each dataset is generated
// in both languages. The Spanish sources carry translated place descriptions
// ("Servicios de Drogas y Alcohol"), which the map list needs.
const SOURCES = {
  en: {
    directory: path.join(__dirname, '../../Directory.md'),
    guide: path.join(__dirname, '../../Resource guide.md'),
    suffix: ''
  },
  es: {
    directory: path.join(__dirname, '../../Directory_es.md'),
    guide: path.join(__dirname, '../../Resource guide_es.md'),
    suffix: '-es'
  }
};

const out = (base, suffix) => path.join(OUTPUT_DIR, `${base}${suffix}.js`);

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

    // Use the address from the link text, prefixed with the city it was
    // listed under. Without the city an address like "1559 10th St." is
    // ambiguous across the county — and the map list is text-only, so it
    // cannot rely on the marker's position to disambiguate.
    const address = linkText.trim();
    const label = currentCity ? `${currentCity}, ${address}` : address;

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
 * Extract naloxone location coordinates from Resource guide.md
 * This has a different format - it's a ### section with inline map links
 */
function extractNaloxoneLocations(content) {
  const locations = [];

  // Find the naloxone section (it's a ### section)
  // Match on the anchor id, which is stable across translations; the heading
  // text itself is localised ("Naloxona / Narcan" in the Spanish guide).
  const sectionRegex = /### <a id="naloxone-narcan">[^<]*<\/a>/i;
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

  for (const [lang, src] of Object.entries(SOURCES)) {
    console.log(`— ${lang} —`);

    const directoryContent = fs.readFileSync(src.directory, 'utf8');
    const directoryName = path.basename(src.directory);

    const libraries = extractCoordinates(directoryContent, 'Little-Free-Libraries', 'Little Free Library');
    generateDataFile(libraries, out('little-free-libraries-data', src.suffix),
                     'little-free-libraries-map', 'blue', directoryName);

    const pantries = extractCoordinates(directoryContent, 'Little-Free-Pantries', 'Little Free Pantry');
    generateDataFile(pantries, out('little-free-pantries-data', src.suffix),
                     'little-free-pantries-map', 'orange', directoryName);

    const guideContent = fs.readFileSync(src.guide, 'utf8');
    const guideName = path.basename(src.guide);

    const naloxoneLocations = extractNaloxoneLocations(guideContent);
    generateDataFile(naloxoneLocations, out('naloxone-locations-data', src.suffix),
                     'naloxone-locations-map', 'red', guideName);
  }

  console.log('\n✓ Map data extraction complete!');
  console.log('  Map HTML files can now import these data files.');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
