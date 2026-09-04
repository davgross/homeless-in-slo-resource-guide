# Changedetection.io Configuration Management

This directory contains version-controlled configuration for
changedetection.io monitoring.

## How changedetection.io stores its data

Since roughly version 0.54 the datastore is laid out like this:

- `changedetection-data/<uuid>/watch.json` — one file per watch, holding both
  configuration *and* runtime state
- `changedetection-data/<uuid>/` — also holds that watch's history index and
  compressed page snapshots
- `changedetection-data/changedetection.json` — application settings (worker
  count, default check interval, notification defaults, proxies)
- `changedetection-data/changedetection-<version>.json` — settings backups the
  app writes automatically on each version upgrade

Two details drive everything below:

1. The container runs as root and writes `watch.json` with mode 0600, so your
   host user **cannot read or write those files directly**. Scripts here reach
   them through a throwaway root container (`cd_datastore.py`).
2. The app keeps all watches in memory and rewrites `watch.json` when it saves.
   Editing those files underneath a running container silently loses the edits,
   so anything that writes to the datastore requires the stack to be stopped.

Older versions used a single `changedetection-data/url-watches.json`. That file
is no longer read or written; if you find one, it is a leftover.

## Problem

A watch's `watch.json` mixes:

- **Configuration** (what to watch, filters, notification settings) — should
  be version controlled
- **Runtime state** (check counts, timestamps, last errors) — constantly
  changing, shouldn't be in git

## Solution

Keep the config separately:

1. **`changedetection-config.json`** — version controlled, configuration only:
   URLs, filters and selectors, notification settings, browser steps.
2. **`changedetection-data/`** — not in git (see `.gitignore`); full runtime
   state, history, and page snapshots.

## Workflow

### Exporting current config (after making changes in the UI)

```bash
python3 extract-config.py
git add changedetection-config.json
git commit -m "Update monitoring configuration"
```

Works with the stack running (reads the live API) or stopped (reads the
`watch.json` files directly). Both paths produce identical output. The script
refuses to write a partial or empty export rather than quietly dropping watches
from version control.

### Applying config (after pulling changes or switching branches)

```bash
docker compose stop
python3 apply-config.py
docker compose up -d
```

`apply-config.py` merges the config fields into each existing `watch.json` and
leaves every runtime field alone, so check history and timestamps survive. It
refuses to run while the container is up. It never deletes watches; if the
datastore holds watches absent from the config file, it says so and leaves them.

### Starting fresh (new machine, new deployment)

```bash
docker compose up -d      # create the datastore
docker compose stop
python3 apply-config.py   # install the watches
docker compose up -d
```

### Updating changedetection.io

```bash
./update-changedetection.sh
```

Pulls the images and exits early if nothing is new. If there is an update it
exports the config while the app is still up, stops the stack, takes a verified
backup, and only then starts the new version — datastore migrations run on first
boot and are one-way, so the backup has to happen before that.

### Backups

```bash
./backup-monitoring.sh
```

Archives to `~/changedetection-backups/`, verifies the watch count inside the
archive, and only rotates old backups once a good one exists.

## Scripts

- **`cd_datastore.py`** — shared helper for root-level datastore reads/writes
- **`extract-config.py`** — extract config-only data (live API, or datastore fallback)
- **`apply-config.py`** — apply config into the datastore, preserving runtime state
- **`backup-monitoring.sh`** — verified backup of the whole datastore
- **`update-changedetection.sh`** — safe image update

## What's Not Version Controlled

Excluded from `changedetection-config.json`:

- `check_count`, `last_checked`, `last_viewed`
- `date_created`, `fetch_time`
- `previous_md5`, `previous_md5_before_filters`
- `last_error`, `last_notification_error`
- `notification_alert_count`
- `consecutive_filter_failures`
- All other runtime/state fields

Also not version controlled: application settings in
`changedetection-data/changedetection.json` (worker count, default check
interval, notification defaults). Only per-watch configuration is tracked.
