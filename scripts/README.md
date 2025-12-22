# VivaSLO Scripts

Maintenance and validation scripts for the VivaSLO Resource Guide.

## Link Checking

### extract-urls.js

Extracts all external URLs from markdown files for link checking.

**Usage:**
```bash
node scripts/extract-urls.js [output-file]
```

**Default output:** `scripts/urls.json`

**What it extracts:**
- URLs from markdown links `[text](url)` (user-facing clickable links only)
- All http/https URLs from: Directory.md, Resource guide.md, About.md (and Spanish versions)

**What it excludes:**
- `<!-- Source: ... -->` comment URLs (not user-facing, checked separately)
- `tel:`, `sms:`, `mailto:` links
- Internal anchors (`#section`)
- Relative paths (`?section=directory`)
- Map coordinate links

**Output format:**
```json
{
  "metadata": {
    "extractedAt": "2025-12-22T21:53:58.901Z",
    "totalUrls": 1312,
    "files": ["Directory.md", "Resource guide.md", ...]
  },
  "urls": [
    {
      "url": "https://example.com",
      "occurrences": [
        {
          "source": "Directory.md",
          "type": "markdown-link",
          "line": 123,
          "context": "Example text with [link](url)"
        }
      ]
    }
  ]
}
```

### check-links.js

Checks URLs for broken links (404s, timeouts, DNS failures, etc.).

**Usage:**
```bash
node scripts/check-links.js [urls-file] [--output=json|markdown|github]
```

**Default input:** `scripts/urls.json`
**Default output format:** `github` (markdown formatted for GitHub issues)

**Options:**
- `--output=json`: Machine-readable JSON output
- `--output=markdown`: Human-readable markdown
- `--output=github`: Markdown formatted for GitHub issues (default)

**Example:**
```bash
# Extract URLs and check them
node scripts/extract-urls.js
node scripts/check-links.js

# Check specific file
node scripts/check-links.js my-urls.json --output=json > results.json
```

**How it works:**
- Uses GET requests with browser-like User-Agent to avoid bot detection
- Checks 5 URLs concurrently (respectful rate limiting)
- Retries failures up to 3 times with 3-second delays
- 20-second timeout per request
- Ignores SSL certificate errors (expired certs)
- Categorizes results into:
  - **Errors:** Genuine issues (404 Not Found, DNS failures)
  - **Warnings:** Likely false positives (bot detection, VPN blocking, temporary server errors)
  - **OK:** Working links

**Philosophy:**
This checker is intentionally **lenient** to minimize false positives. Many sites block automated requests but work fine in browsers. Only genuine failures (404s, non-existent domains) are flagged as errors.

**Known issues handled:**
- Facebook/social media bot detection → marked as OK
- 403/405/409 errors → warnings (often work in browser)
- 500/503 server errors → warnings (temporary issues)
- VPN blocking → warnings
- Expired SSL certificates → ignored

**Exit codes:**
- `0`: No genuine errors found (warnings OK)
- `1`: Genuine errors found (404s, DNS failures)

## GitHub Action

The link checker runs automatically via GitHub Actions.

**Schedule:** Every Monday at 9:00 AM UTC (1:00 AM PST)

**Manual trigger:**
```bash
# Go to Actions tab in GitHub, select "Check Links", click "Run workflow"
```

**What it does:**
1. Extracts URLs from all markdown files
2. Checks each URL
3. If broken links found:
   - Creates/updates a GitHub issue with the report
   - Labels: `broken-links`, `automated`, `maintenance`
4. If all links working and issue exists:
   - Adds comment and closes the issue

**Workflow file:** `.github/workflows/check-links.yml`

## Other Scripts

### extract-map-data.js

Extracts map coordinates from markdown files for the interactive maps (Little Free Libraries, Little Free Pantries, Naloxone locations).

### validate-html.js

Validates generated HTML during the build process.

## Development

All scripts use ES modules (`import`/`export`) and require Node.js 18+.

To add the scripts directory to your PATH temporarily:
```bash
export PATH="$PATH:$(pwd)/scripts"
```

## Maintenance

When adding new markdown files that contain URLs:
1. Add the filename to `FILES_TO_PROCESS` in `extract-urls.js`
2. The next scheduled run will automatically include them
