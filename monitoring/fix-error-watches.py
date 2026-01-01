#!/usr/bin/env python3
"""
Switch watches with 403/202 errors to browser rendering.
"""
import json
from urllib.request import Request, urlopen
import time

API_KEY = "4d5dd39ccb65b8a4530cfe3e34d4f32c"
BASE_URL = "http://localhost:5000"

# Read-only fields that must be removed before updating
READONLY_FIELDS = ['last_changed', 'last_checked', 'last_error', 'link', 'viewed', 
                   'date_created', 'last_notification_error', 'browser_steps_last_error_step',
                   'remote_server_reply', 'page_title']

# Get all watches
headers = {'x-api-key': API_KEY}
req = Request(f"{BASE_URL}/api/v1/watch", headers=headers)
with urlopen(req) as response:
    watches = json.loads(response.read())

print(f"Checking {len(watches)} watches for 403/202 errors...\n")

needs_browser = []

# Find watches with 403 or 202 errors
for watch_id, watch_data in watches.items():
    url = watch_data.get('url', '')
    last_error = watch_data.get('last_error', '')
    
    if last_error and ('403' in last_error or '202' in last_error):
        error_type = '403 Forbidden' if '403' in last_error else '202 Accepted'
        needs_browser.append((watch_id, url, error_type))

if not needs_browser:
    print("✓ No watches found with 403 or 202 errors!")
    exit(0)

print(f"Found {len(needs_browser)} watches with 403/202 errors:\n")

for i, (watch_id, url, error_type) in enumerate(needs_browser, 1):
    domain = url.split('/')[2] if '://' in url else url.split('/')[0]
    print(f"{i}. [{error_type}] {domain}")

print(f"\nSwitching these {len(needs_browser)} watches to browser rendering...\n")

switched = 0
errors = 0

for i, (watch_id, url, error_type) in enumerate(needs_browser, 1):
    # Get fresh watch data
    req = Request(f"{BASE_URL}/api/v1/watch", headers=headers)
    with urlopen(req) as response:
        watches = json.loads(response.read())
    
    watch_data = watches.get(watch_id)
    if not watch_data:
        print(f"[{i}/{len(needs_browser)}] ✗ Watch not found: {url[:50]}")
        errors += 1
        continue
    
    # Remove read-only fields
    for field in READONLY_FIELDS:
        watch_data.pop(field, None)
    
    # Switch to browser rendering
    watch_data['fetch_backend'] = 'html_webdriver'
    
    # Update the watch
    update_req = Request(
        f"{BASE_URL}/api/v1/watch/{watch_id}",
        data=json.dumps(watch_data).encode('utf-8'),
        headers={'Content-Type': 'application/json', 'x-api-key': API_KEY},
        method='PUT'
    )
    
    try:
        with urlopen(update_req, timeout=10) as resp:
            if resp.status == 200:
                domain = url.split('/')[2] if '://' in url else url.split('/')[0]
                print(f"[{i}/{len(needs_browser)}] ✓ [{error_type}] {domain[:50]}")
                switched += 1
            else:
                print(f"[{i}/{len(needs_browser)}] ✗ Error {resp.status}: {url[:50]}")
                errors += 1
    except Exception as e:
        print(f"[{i}/{len(needs_browser)}] ✗ {str(e)[:60]}")
        errors += 1
    
    # Small delay to avoid overwhelming the API
    time.sleep(0.1)

print("\n" + "="*70)
print(f"Complete: {switched} switched to browser, {errors} errors")
print("\nThese watches will now use Chrome/Javascript rendering.")
print("Re-run checks to see if the errors are resolved.")
