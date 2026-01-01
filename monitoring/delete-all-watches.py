#!/usr/bin/env python3
"""Delete all watches from Changedetection.io"""
import json
from urllib.request import Request, urlopen

API_KEY = "4d5dd39ccb65b8a4530cfe3e34d4f32c"
BASE_URL = "http://localhost:5000"

# Get all watches
headers = {'x-api-key': API_KEY}
req = Request(f"{BASE_URL}/api/v1/watch", headers=headers)
with urlopen(req) as response:
    watches = json.loads(response.read())

print(f"Found {len(watches)} watches to delete")
print("Deleting all watches...")

deleted = 0
for watch_id in watches.keys():
    delete_req = Request(
        f"{BASE_URL}/api/v1/watch/{watch_id}",
        headers=headers,
        method='DELETE'
    )
    try:
        with urlopen(delete_req) as resp:
            if resp.status == 204:
                deleted += 1
                if deleted % 50 == 0:
                    print(f"  Deleted {deleted}/{len(watches)}...")
    except Exception as e:
        print(f"  Error deleting {watch_id}: {e}")

print(f"\nDone! Deleted {deleted} watches")
