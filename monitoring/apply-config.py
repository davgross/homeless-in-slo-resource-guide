#!/usr/bin/env python3
"""
Apply configuration from changedetection-config.json to the datastore.

Writes each watch's config fields into <uuid>/watch.json, preserving every
runtime field already there (check counts, timestamps, history, md5s).

Must be run with the container STOPPED.  changedetection.io holds all watches
in memory and rewrites watch.json when it saves, so edits made underneath a
running container are silently discarded.
"""
import json
import os
import sys

import cd_datastore

CONFIG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'changedetection-config.json')

if cd_datastore.container_running():
    sys.exit(
        "Error: the '%s' container is running.\n"
        "It keeps watches in memory and would overwrite these edits.\n"
        "Stop it first:\n"
        "  docker compose -f %s stop\n"
        "then re-run this script and start the stack again."
        % (cd_datastore.CONTAINER,
           os.path.join(os.path.dirname(os.path.abspath(__file__)), 'docker-compose.yml'))
    )

with open(CONFIG_FILE) as f:
    config = json.load(f)['watching']

if not config:
    sys.exit("Error: %s contains no watches; nothing to apply." % CONFIG_FILE)

existing = cd_datastore.read_all_watches()

new = [u for u in config if u not in existing]
extra = [u for u in existing if u not in config]

result = cd_datastore.merge_watches(config)

print("Applied config for %d watches" % result['written'])
if result['created']:
    print("  %d watch(es) created from config (no prior watch.json): %s"
          % (result['created'], ', '.join(new[:5]) + ('...' if len(new) > 5 else '')))
if extra:
    print("  %d watch(es) exist in the datastore but not in the config file." % len(extra))
    print("  They were left untouched; this script never deletes watches.")

print("\nStart the stack to pick up the changes:")
print("  docker compose -f %s up -d"
      % os.path.join(os.path.dirname(os.path.abspath(__file__)), 'docker-compose.yml'))
