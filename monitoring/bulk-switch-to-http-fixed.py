#!/usr/bin/env python3
"""
Bulk update all watches to use plain HTTP instead of browser rendering.
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

print(f"Found {len(watches)} watches to update")

# Sites that NEED browser rendering (JavaScript-heavy)
js_required_domains = [
    'google.com/forms',
    'docs.google.com',
    'calendly.com',
]

switched = 0
kept_browser = 0
errors = 0

for i, (watch_id, watch_data) in enumerate(watches.items(), 1):
    url = watch_data.get('url', '')
    
    # Remove read-only fields
    for field in READONLY_FIELDS:
        watch_data.pop(field, None)
    
    # Check if this domain needs JavaScript
    needs_js = any(domain in url for domain in js_required_domains)
    
    if needs_js:
        # Keep browser rendering for JS-heavy sites
        watch_data['fetch_backend'] = 'html_webdriver'
        kept_browser += 1
        action = "Kept browser"
    else:
        # Switch to plain HTTP
        watch_data['fetch_backend'] = 'html_requests'
        switched += 1
        action = "→ HTTP"
    
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
                if i % 20 == 0:  # Print every 20th update
                    print(f"[{i}/{len(watches)}] ✓ {action}: {domain[:50]}")
            else:
                print(f"[{i}/{len(watches)}] ✗ Error {resp.status}: {url[:50]}")
                errors += 1
    except Exception as e:
        print(f"[{i}/{len(watches)}] ✗ {str(e)[:60]}")
        errors += 1
    
    # Small delay to avoid overwhelming the API
    if i % 50 == 0:
        time.sleep(0.5)
    else:
        time.sleep(0.05)

print("\n" + "="*70)
print(f"Update complete!")
print(f"  Switched to HTTP: {switched}")
print(f"  Kept browser: {kept_browser}")
print(f"  Errors: {errors}")
