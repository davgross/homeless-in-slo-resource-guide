#!/usr/bin/env python3
"""
Extract configuration-only data from changedetection.io.

Preferred: reads live state from the running container via the API.
Fallback:  reads from changedetection-data/url-watches.json when the
           container is not running.
"""
import json
import os
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed

API_BASE = 'http://localhost:5000/api/v1'
WATCHES_FILE = os.path.join(os.path.dirname(__file__), 'changedetection-data', 'url-watches.json')
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), 'changedetection-config.json')
MAX_WORKERS = 20

# Fields that are configuration (version controlled)
CONFIG_FIELDS = [
    'url',
    'tag',
    'tags',
    'title',
    'browser_steps',
    'extract_text',
    'filter_text_added',
    'filter_text_removed',
    'filter_text_replaced',
    'headers',
    'ignore_text',
    'include_filters',
    'method',
    'processor',
    'subtractive_selectors',
    'trigger_text',
    'css_filter',
    'notification_urls',
    'notification_title',
    'notification_body',
    'notification_format',
]

DEFAULT_VALUES = [None, '', [], {}, False]


def extract_config(watch):
    result = {}
    for field in CONFIG_FIELDS:
        if field in watch:
            value = watch[field]
            if value not in DEFAULT_VALUES:
                result[field] = value
    return result


def fetch_from_api():
    """Fetch live watch configs from the running container's API."""
    import requests

    # Get list of all watch UUIDs
    resp = requests.get(f'{API_BASE}/watch', timeout=10)
    resp.raise_for_status()
    uuids = list(resp.json().keys())

    print(f"Fetching {len(uuids)} watches from live API...")

    def fetch_one(uuid):
        r = requests.get(f'{API_BASE}/watch/{uuid}', timeout=10)
        r.raise_for_status()
        return uuid, r.json()

    watches = {}
    failed = []
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {executor.submit(fetch_one, uuid): uuid for uuid in uuids}
        for i, future in enumerate(as_completed(futures), 1):
            uuid = futures[future]
            try:
                uuid, data = future.result()
                cfg = extract_config(data)
                if cfg:
                    watches[uuid] = cfg
            except Exception as e:
                failed.append((uuid, str(e)))
            if i % 100 == 0:
                print(f"  {i}/{len(uuids)}...")

    if failed:
        print(f"Warning: {len(failed)} watches could not be fetched:", file=sys.stderr)
        for uuid, err in failed:
            print(f"  {uuid}: {err}", file=sys.stderr)

    return watches, 'live API'


def fetch_from_file():
    """Read watch configs from the on-disk url-watches.json."""
    print(f"Reading from {WATCHES_FILE}...")
    with open(WATCHES_FILE, 'r') as f:
        data = json.load(f)

    watches = {}
    for uuid, watch in data['watching'].items():
        cfg = extract_config(watch)
        if cfg:
            watches[uuid] = cfg

    return watches, 'url-watches.json'


# Try live API first, fall back to file
try:
    import requests
    requests.get(f'{API_BASE}/watch', timeout=5).raise_for_status()
    config_watches, source = fetch_from_api()
except Exception as e:
    print(f"API unavailable ({e}), falling back to file.")
    config_watches, source = fetch_from_file()

config_data = {
    'note': 'Configuration-only export for version control',
    'watching': config_watches,
}

with open(OUTPUT_FILE, 'w') as f:
    json.dump(config_data, f, indent=2, sort_keys=True)

output_bytes = os.path.getsize(OUTPUT_FILE)
print(f"Extracted config for {len(config_watches)} watches (source: {source})")
print(f"Config file: {OUTPUT_FILE} ({output_bytes:,} bytes)")
