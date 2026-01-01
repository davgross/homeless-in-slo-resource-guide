#!/usr/bin/env python3
"""List all watches getting 202 errors"""
import json
from urllib.request import Request, urlopen

API_KEY = "4d5dd39ccb65b8a4530cfe3e34d4f32c"
BASE_URL = "http://localhost:5000"

headers = {'x-api-key': API_KEY}
req = Request(f"{BASE_URL}/api/v1/watch", headers=headers)
with urlopen(req) as response:
    watches = json.loads(response.read())

watches_202 = []
for watch_id, watch_data in watches.items():
    last_error = watch_data.get('last_error', '')
    if last_error and '202' in last_error:
        url = watch_data.get('url', '')
        watches_202.append(url)

if not watches_202:
    print("No watches with 202 errors found!")
else:
    print(f"Found {len(watches_202)} watches with 202 errors:\n")
    
    # Group by domain
    by_domain = {}
    for url in watches_202:
        domain = url.split('/')[2] if '://' in url else url.split('/')[0]
        if domain not in by_domain:
            by_domain[domain] = []
        by_domain[domain].append(url)
    
    for domain, urls in sorted(by_domain.items()):
        print(f"\n{domain} ({len(urls)} watches):")
        for url in urls:
            print(f"  - {url}")
    
    print(f"\n\nTotal: {len(watches_202)} watches across {len(by_domain)} domains")
