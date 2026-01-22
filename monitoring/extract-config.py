#!/usr/bin/env python3
"""
Extract configuration-only data from changedetection.io url-watches.json
This creates a clean, version-controllable file without runtime state.
"""
import json
import sys

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

# Read the full state file
with open('changedetection-data/url-watches.json', 'r') as f:
    data = json.load(f)

# Extract only config fields for each watch
config_watches = {}
for uuid, watch in data['watching'].items():
    config_watch = {}
    for field in CONFIG_FIELDS:
        if field in watch:
            value = watch[field]
            # Skip empty/default values to keep file clean
            if value in [None, '', [], {}, False]:
                continue
            config_watch[field] = value
    
    # Only include if there's actual config (not just a URL)
    if config_watch:
        config_watches[uuid] = config_watch

# Create config-only structure
config_data = {
    'note': 'Configuration-only export for version control',
    'watching': config_watches
}

# Write to config file
with open('changedetection-config.json', 'w') as f:
    json.dump(config_data, f, indent=2, sort_keys=True)

print(f"Extracted config for {len(config_watches)} watches")
print(f"Config file: changedetection-config.json ({len(json.dumps(config_data))} bytes)")
print(f"Original file: changedetection-data/url-watches.json ({len(json.dumps(data))} bytes)")
