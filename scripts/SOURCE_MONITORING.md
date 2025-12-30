# Source Monitoring System

Automated monitoring system for tracking changes to source URLs cited in the Resource Guide and Directory markdown files.

## Overview

This system monitors ~1,800 source annotations across `Resource guide.md` and `Directory.md` to detect when the information on source pages has changed. It uses smart text matching to find specific claims on source pages and monitors only the relevant content, minimizing false positives.

### Key Features

- **Smart Matching**: 71.7% success rate finding claims on source pages
  - Phone numbers: 90%, Addresses: 80%, Email: 70%, Money: 70%, General text: 90%
  - Hours: 30% (challenging due to format variations)
- **Fuzzy Matching**: Handles formatting variations (e.g., "(805) 544-4004" matches "805-544-4004")
- **Batch Processing**: Checks 100 sources per day, completing full cycle in ~18 days
- **Priority Scheduling**: Critical contact info checked every ~3 days, general descriptions every ~30 days
- **Change Detection**: Identifies high/medium/low severity changes with context comparison
- **GitHub Integration**: Creates issues for detected changes with detailed reports

## Architecture

### Components

1. **extract-claim-sources.js** - Extracts claim-source pairs from markdown files
2. **fetch-source-content.js** - Fetches sources and performs smart text matching
3. **detect-source-changes.js** - Compares current vs. previous snapshots
4. **batch-monitor.js** - Orchestrates the entire process
5. **source-monitor-config.json** - Configuration settings
6. **GitHub Actions Workflow** - Daily automation

### Data Flow

```
Resource guide.md + Directory.md
  ↓ (extract-claim-sources.js)
claim-sources.json (~1,800 claim-source pairs)
  ↓ (batch-monitor.js selects next 100)
current-batch.json
  ↓ (fetch-source-content.js)
source-snapshots.json
  ↓ (detect-source-changes.js + previous snapshot)
source-changes-report.json
  ↓ (GitHub Actions)
GitHub Issue
```

## Quick Start

### Prerequisites

- Node.js 18+
- npm dependencies installed (`npm ci`)

### Running Manually

1. **Extract claim-source pairs** (run after markdown files change):
   ```bash
   node scripts/extract-claim-sources.js
   ```

2. **Run batch monitor** (checks next 100 sources):
   ```bash
   node scripts/batch-monitor.js 100
   ```

3. **View results**:
   - `scripts/source-changes-report.json` - Detected changes
   - `scripts/batch-state.json` - Current progress
   - `scripts/source-snapshots.json` - Latest snapshot

### GitHub Actions

The workflow runs automatically:
- **Schedule**: Daily at 3:00 AM UTC
- **Manual**: Via workflow_dispatch in GitHub Actions tab
- **Artifacts**: Snapshots and state stored for 90 days

## Configuration

Edit `scripts/source-monitor-config.json` to adjust settings:

```json
{
  "batch": {
    "defaultSize": 100,          // Claims to check per run
    "maxConcurrent": 5,          // Parallel requests
    "retryAttempts": 3,
    "retryDelay": 3000,          // ms between retries
    "requestTimeout": 20000      // ms per request
  },
  "priority": {
    "highCheckInterval": 3,      // days - contact info
    "normalCheckInterval": 7,    // days - services/money
    "lowCheckInterval": 30       // days - general descriptions
  },
  "changeDetection": {
    "confidenceDropThreshold": 0.3,  // Flag if match confidence drops >30%
    "similarityThreshold": 0.7       // Flag if text <70% similar
  }
}
```

## Understanding Results

### Success Rates by Claim Type

Based on testing with 60 diverse claims:

| Claim Type | Success Rate | Notes |
|------------|--------------|-------|
| Phone      | 90%          | Excellent - handles various formats |
| General    | 90%          | Keyword matching works well |
| Address    | 80%          | Good - handles abbreviations |
| Email      | 70%          | Good - case insensitive |
| Money      | 70%          | Good - handles ranges |
| Hours      | 30%          | Challenging - many format variations |

### Change Severity Levels

- **High**: Claim disappeared, or content changed significantly (>70% different)
  - Action: Verify source and update markdown immediately
- **Medium**: Confidence drop >30%, suggesting reformatting
  - Action: Review and verify claim still valid
- **Low**: Minor content changes, or claim appeared (previous false negative)
  - Action: Review when convenient

### False Positives

The system is designed to minimize false positives:
- Monitors only the 500-char context around each claim, not entire pages
- Ignores navigation, footers, and dynamic content
- Requires significant changes before flagging (similarity <70%)
- Low-confidence matches (<0.4) are not reported as changes

Claims not found on source pages (~30%) are logged but don't generate change alerts.

## File Reference

### Generated Files

- **claim-sources.json** - All extracted claim-source pairs (1,798 claims)
- **current-batch.json** - Current batch being processed (100 claims)
- **source-snapshots.json** - Latest snapshot of checked sources
- **source-snapshots-previous.json** - Previous snapshot for comparison
- **source-changes-report.json** - Detected changes with details
- **batch-state.json** - Tracking state and check history

### State Management

The `batch-state.json` file tracks:
```json
{
  "lastRun": "2025-12-29T03:00:00.000Z",
  "currentBatch": 18,
  "batchSize": 100,
  "checkHistory": {
    "resource-guide:73": {
      "lastChecked": "2025-12-29T03:00:00.000Z",
      "checkCount": 5,
      "lastChanged": "2025-12-10T03:00:00.000Z",
      "consecutiveUnchanged": 3
    }
  }
}
```

## Priority Algorithm

Claims are scored based on:

1. **Priority weight** (30 points max)
   - High priority (contact info): 30 points
   - Normal priority (services, money): 20 points
   - Low priority (general): 10 points

2. **Age since last check** (40 points max)
   - Linear scale: older = higher score
   - Capped at 60 days

3. **Change history** (30 points max)
   - Changed <30 days ago: +30 points
   - Changed 30-90 days ago: +20 points
   - Unchanged >5 times: -10 points

4. **Interval bonus** (+20 points)
   - Past due for check based on priority interval

Claims with highest scores are checked first.

## Troubleshooting

### Common Issues

**"claim-sources.json not found"**
```bash
node scripts/extract-claim-sources.js
```

**Low match rates for specific claim types**
- Check `source-monitor-config.json` confidence thresholds
- Review specific claims in `source-snapshots.json`
- Some pages may block automated requests (403/503 errors)

**Too many false positives**
- Increase `similarityThreshold` in config (default: 0.7)
- Increase `confidenceDropThreshold` (default: 0.3)

**Not enough coverage**
- Increase `batch.defaultSize` in config
- Decrease priority check intervals for faster cycles

### Debugging

Enable verbose output:
```bash
# Check a single claim
node -e "
const data = require('./scripts/claim-sources.json');
const claim = data.claims.find(c => c.id === 'resource-guide:73');
console.log(JSON.stringify(claim, null, 2));
"

# Test matching for one source
node -e "
const batch = {
  metadata: require('./scripts/claim-sources.json').metadata,
  claims: [require('./scripts/claim-sources.json').claims[0]]
};
require('fs').writeFileSync('scripts/debug-batch.json', JSON.stringify(batch, null, 2));
"
node scripts/fetch-source-content.js scripts/debug-batch.json scripts/debug-snapshots.json
```

## Maintenance

### Monthly Tasks

1. Review false positive rate from recent issues
2. Adjust configuration thresholds if needed
3. Check batch state progress: `cat scripts/batch-state.json | jq '.checkHistory | length'`
4. Verify all claims will be checked within target intervals

### When Markdown Files Change

After significant updates to Resource guide.md or Directory.md:
```bash
# Re-extract claims
node scripts/extract-claim-sources.js

# Reset batch state to recheck all sources
rm scripts/batch-state.json

# Or manually trigger workflow to start fresh cycle
```

### Updating the System

When adding new claim types or improving matching:
1. Update extraction patterns in `extract-claim-sources.js`
2. Update normalization rules in `fetch-source-content.js`
3. Test with diverse batch: `node scripts/batch-monitor.js 60`
4. Review success rates and adjust as needed

## Performance

### Timing

- Extract claims: ~1-2 seconds
- Fetch 100 sources: ~10-15 seconds (depends on network and server response times)
- Detect changes: <1 second
- Full batch cycle: ~15-20 seconds

### Rate Limiting

- Maximum 5 concurrent requests
- 20-second timeout per request
- 3 retry attempts with 3-second delays
- Browser-like headers to avoid bot detection

### Resource Usage

- Minimal CPU/memory (Node.js scripts)
- Network: ~100 HTTP requests per day
- Storage: ~5MB for all state files and snapshots
- GitHub Artifacts: ~5MB per run (90-day retention)

## Future Enhancements

Potential improvements:

1. **Claim-specific matching rules** - Custom patterns for specific agencies
2. **Email notifications** - Alert specific maintainers for high-severity changes
3. **Visual diff tool** - Web interface to review context changes
4. **Machine learning** - Improve matching using trained models
5. **Webhook integration** - Real-time notifications via Slack/Discord
6. **Historical tracking** - Long-term trends and change frequency analysis
7. **Manual override** - Mark claims as verified even if not found

## Contributing

When modifying the source monitoring system:

1. Test changes with diverse batch before committing
2. Update this documentation
3. Adjust configuration defaults if behavior changes
4. Add examples for new features
5. Consider backwards compatibility with existing state files

## License

Part of the VivaSLO Resource Guide project.
