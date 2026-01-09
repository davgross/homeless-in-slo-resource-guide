#!/usr/bin/env python3
"""
Apply configuration from changedetection-config.json to url-watches.json
Preserves existing runtime state (check counts, timestamps, etc.)
"""
import json
import sys

# Read the config file
with open('changedetection-config.json', 'r') as f:
    config = json.load(f)

# Read the current state file (or create new if doesn't exist)
try:
    with open('changedetection-data/url-watches.json', 'r') as f:
        data = json.load(f)
except FileNotFoundError:
    data = {
        'note': 'Hello! If you change this file manually, please be sure to restart your changedetection.io instance!',
        'watching': {}
    }

# Update watches with config, preserving runtime state
for uuid, config_watch in config['watching'].items():
    if uuid in data['watching']:
        # Merge config into existing watch (preserves state)
        data['watching'][uuid].update(config_watch)
    else:
        # New watch - use config as base
        data['watching'][uuid] = config_watch.copy()

print(f"Applied config for {len(config['watching'])} watches")
print(f"Total watches in state file: {len(data['watching'])}")
print("\nNote: You need to restart changedetection.io container for changes to take effect:")
print("  docker restart changedetection")
