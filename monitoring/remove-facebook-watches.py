#!/usr/bin/env python3
"""
Remove all Facebook watches (they require login to view).
"""
import json
from urllib.request import Request, urlopen

API_KEY = "4d5dd39ccb65b8a4530cfe3e34d4f32c"
BASE_URL = "http://localhost:5000"

# Get all watches
headers = {'x-api-key': API_KEY}
req = Request(f"{BASE_URL}/api/v1/watch", headers=headers)
with urlopen(req) as response:
    watches = json.loads(response.read())

print(f"Checking {len(watches)} watches for Facebook URLs...\n")

facebook_watches = []

# Find Facebook URLs
for watch_id, watch_data in watches.items():
    url = watch_data.get('url', '')
    if 'facebook.com' in url or 'instagram.com' in url:
        facebook_watches.append((watch_id, url))

if not facebook_watches:
    print("✓ No Facebook/Instagram watches found!")
    exit(0)

print(f"Found {len(facebook_watches)} Facebook/Instagram watches:\n")
for i, (watch_id, url) in enumerate(facebook_watches, 1):
    print(f"{i}. {url}")

print(f"\nDeleting these {len(facebook_watches)} watches...\n")

deleted = 0
for i, (watch_id, url) in enumerate(facebook_watches, 1):
    delete_req = Request(
        f"{BASE_URL}/api/v1/watch/{watch_id}",
        headers=headers,
        method='DELETE'
    )
    try:
        with urlopen(delete_req) as resp:
            if resp.status == 204:
                deleted += 1
                print(f"[{i}/{len(facebook_watches)}] ✓ Deleted: {url[:60]}...")
            else:
                print(f"[{i}/{len(facebook_watches)}] ✗ Error {resp.status}")
    except Exception as e:
        print(f"[{i}/{len(facebook_watches)}] ✗ {str(e)[:60]}")

print("\n" + "="*70)
print(f"Complete: {deleted} Facebook/Instagram watches deleted")
print(f"Remaining watches: {len(watches) - deleted}")
