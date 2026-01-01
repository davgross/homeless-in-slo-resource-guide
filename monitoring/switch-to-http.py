#!/usr/bin/env python3
"""
Switch watches from browser rendering to plain HTTP fetch.
This is faster, uses less memory, and prevents timeouts.
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

# Sites that NEED browser rendering (JavaScript-heavy)
js_required_domains = [
    'google.com',
    'calendly.com',
    'facebook.com',
    'instagram.com',
]

switched = 0
skipped = 0

for watch_id, watch_data in watches.items():
    url = watch_data.get('url', '')
    current_backend = watch_data.get('fetch_backend', 'html_requests')
    
    # Check if this domain needs JavaScript
    needs_js = any(domain in url for domain in js_required_domains)
    
    # If currently using browser and doesn't need JS, switch to HTTP
    if current_backend == 'html_webdriver' and not needs_js:
        # Update watch to use plain HTTP
        watch_data['fetch_backend'] = 'html_requests'
        
        update_req = Request(
            f"{BASE_URL}/api/v1/watch/{watch_id}",
            data=json.dumps(watch_data).encode('utf-8'),
            headers={'Content-Type': 'application/json', 'x-api-key': API_KEY},
            method='PUT'
        )
        
        try:
            with urlopen(update_req) as resp:
                if resp.status == 200:
                    switched += 1
                    domain = url.split('/')[2] if '://' in url else url
                    print(f"✓ Switched to HTTP: {domain[:50]}")
        except Exception as e:
            print(f"✗ Error updating {url[:50]}: {e}")
    else:
        skipped += 1

print(f"\nTotal: {switched} switched to HTTP, {skipped} kept as browser")
