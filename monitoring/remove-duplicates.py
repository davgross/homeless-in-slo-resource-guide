#!/usr/bin/env python3
import json
from urllib.request import Request, urlopen
from collections import defaultdict

API_KEY = "4d5dd39ccb65b8a4530cfe3e34d4f32c"
BASE_URL = "http://localhost:5000"

# Get all watches
headers = {'x-api-key': API_KEY}
req = Request(f"{BASE_URL}/api/v1/watch", headers=headers)
with urlopen(req) as response:
    watches = json.loads(response.read())

# Find duplicates
url_to_ids = defaultdict(list)
for watch_id, watch_data in watches.items():
    url = watch_data.get('url', '')
    url_to_ids[url].append(watch_id)

# Delete duplicates (keep first, delete rest)
deleted_count = 0
for url, ids in url_to_ids.items():
    if len(ids) > 1:
        print(f"Found {len(ids)} copies of: {url[:60]}...")
        # Keep first ID, delete the rest
        for duplicate_id in ids[1:]:
            delete_req = Request(
                f"{BASE_URL}/api/v1/watch/{duplicate_id}",
                headers=headers,
                method='DELETE'
            )
            try:
                with urlopen(delete_req) as resp:
                    if resp.status == 204:
                        deleted_count += 1
                        print(f"  Deleted duplicate: {duplicate_id}")
            except Exception as e:
                print(f"  Error deleting {duplicate_id}: {e}")

print(f"\nTotal duplicates removed: {deleted_count}")
