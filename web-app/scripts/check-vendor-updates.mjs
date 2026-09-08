/**
 * Vendored asset update check
 *
 * Fonts and Leaflet are copied into public/ rather than installed from npm, so
 * nothing else notices when upstream ships a new version — Dependabot and
 * `npm outdated` only look at package.json. This script closes that gap.
 *
 * Usage:
 *   npm run check:vendor
 *
 * Exits 0 when everything is current, 1 when an update is available, and 2 if
 * a check could not be performed (network trouble, an API shape change). A
 * failed check is reported separately from an out-of-date asset, because
 * "we could not tell" and "there is an update" need different responses.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.join(here, '..', 'vendor-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

async function getJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'vivaslo-vendor-check' } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

/** Latest published version of an npm package */
async function checkNpm({ package: pkg }) {
  const data = await getJson(`https://registry.npmjs.org/${pkg}/latest`);
  return data.version;
}

/** Latest GitHub release tag, with any leading "v" stripped */
async function checkGithubRelease({ repo }) {
  const releases = await getJson(`https://api.github.com/repos/${repo}/releases?per_page=1`);
  if (!Array.isArray(releases) || releases.length === 0) throw new Error('no releases returned');
  return releases[0].tag_name.replace(/^v/, '');
}

/**
 * Google Fonts does not expose version numbers directly, but the font file
 * path contains a /vNN/ segment that Google bumps when the family is revised.
 */
async function checkGoogleFonts({ css }) {
  const res = await fetch(css, {
    headers: {
      // Without a modern UA Google serves the legacy ttf CSS
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const body = await res.text();
  const match = body.match(/\/(v\d+)\//);
  if (!match) throw new Error('no /vNN/ segment found in the stylesheet');
  return match[1];
}

const CHECKERS = {
  npm: checkNpm,
  'github-release': checkGithubRelease,
  'google-fonts': checkGoogleFonts
};

const outdated = [];
const errors = [];

for (const asset of manifest.assets) {
  const checker = CHECKERS[asset.check.type];
  if (!checker) {
    errors.push(`${asset.name}: no checker for type "${asset.check.type}"`);
    continue;
  }

  try {
    const latest = await checker(asset.check);
    if (latest === asset.version) {
      console.log(`  up to date   ${asset.name} ${asset.version}`);
    } else {
      console.log(`  UPDATE       ${asset.name} ${asset.version} -> ${latest}`);
      outdated.push({ ...asset, latest });
    }
  } catch (e) {
    console.log(`  check failed ${asset.name}: ${e.message}`);
    errors.push(`${asset.name}: ${e.message}`);
  }
}

console.log('');

if (outdated.length) {
  console.log('Updates available:\n');
  for (const a of outdated) {
    console.log(`- ${a.name}: ${a.version} -> ${a.latest}  (${a.license})`);
    console.log(`  ${a.homepage}`);
    console.log(`  Files: ${a.files.join(', ')}`);
    console.log(`  How it was prepared: ${a.processing}`);
    if (a.notes) console.log(`  Note: ${a.notes}`);
    console.log('');
  }
  console.log('After updating, bump the version in vendor-manifest.json and re-run');
  console.log('`npm run test:a11y`, which asserts the app makes no third-party requests.');
}

if (errors.length && !outdated.length) {
  process.exitCode = 2;
} else if (outdated.length) {
  process.exitCode = 1;
}
