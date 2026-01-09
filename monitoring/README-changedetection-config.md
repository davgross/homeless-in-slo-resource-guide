# Changedetection.io Configuration Management

This directory contains version-controlled configuration for changedetection.io monitoring.

## Problem

The `changedetection-data/url-watches.json` file contains both:
- **Configuration** (what to watch, filters, notification settings) - should be version controlled
- **Runtime state** (check counts, timestamps, last errors) - constantly changing, shouldn't be in git

This makes it difficult to version control properly.

## Solution

We maintain two separate files:

1. **`changedetection-config.json`** - Version controlled, contains only configuration
   - URLs to watch
   - Filters and selectors  
   - Notification settings
   - Browser steps
   - This file is in git

2. **`changedetection-data/url-watches.json`** - Not in git, contains full runtime state
   - All config fields PLUS runtime data
   - Check counts, timestamps, errors
   - Ignored by git (see `.gitignore`)

## Workflow

### Exporting current config (after making changes in UI)

```bash
python3 extract-config.py
git add changedetection-config.json
git commit -m "Update monitoring configuration"
```

### Applying config (after pulling changes or switching branches)

```bash
python3 apply-config.py
docker restart changedetection
```

### Starting fresh (new machine, new deployment)

```bash
# Install the config
python3 apply-config.py

# Fix permissions if needed
docker run --rm -v $(pwd)/changedetection-data:/datastore alpine chmod 644 /datastore/url-watches.json

# Start container
docker start changedetection
```

## Branch Strategy

Since runtime state is not version controlled:

1. **Make config changes in UI** → Export with `extract-config.py` → Commit to branch
2. **Switch branches** → Runtime state persists (not affected by branch changes)
3. **Apply branch config** → Run `apply-config.py` to sync config from new branch
4. **Restart container** → Changes take effect

The runtime state (check history, timestamps) will be preserved across branch switches unless you explicitly apply different config.

## Scripts

- **`extract-config.py`** - Extract config-only data from runtime state file
- **`apply-config.py`** - Apply config to runtime state file (preserves existing state)

## What's Not Version Controlled

These fields are excluded from `changedetection-config.json`:
- `check_count`, `last_checked`, `last_viewed`
- `date_created`, `fetch_time`
- `previous_md5`, `previous_md5_before_filters`
- `last_error`, `last_notification_error`
- `notification_alert_count`
- `consecutive_filter_failures`
- All other runtime/state fields

Only configuration that you'd set in the UI is preserved.
