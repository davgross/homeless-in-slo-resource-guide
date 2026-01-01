#!/usr/bin/env python3
"""
Import URLs with deduplication and using system default fetch method.
"""
import sys
import json
import time
from urllib.request import Request, urlopen
from urllib.error import HTTPError

API_KEY = "4d5dd39ccb65b8a4530cfe3e34d4f32c"
BASE_URL = "http://localhost:5000"
TAG = "resource-guide"
URL_FILE = "source-urls.txt"

def add_watch(url, tag, api_token):
    """Add a single URL to Changedetection.io"""
    api_url = f"{BASE_URL}/api/v1/watch"
    
    # Basic watch configuration - NO fetch_backend to use system default
    watch_data = {
        "url": url,
        "tag": tag,
        "check_unique_lines": True,
        "extract_title_as_title": True,
        "trigger_check": False,
    }
    
    data = json.dumps(watch_data).encode('utf-8')
    headers = {
        'Content-Type': 'application/json',
        'x-api-key': api_token
    }
    
    req = Request(api_url, data=data, headers=headers, method='POST')
    
    try:
        with urlopen(req, timeout=10) as response:
            if response.status == 201:
                return True, "Success"
            else:
                return False, f"HTTP {response.status}"
    except HTTPError as e:
        return False, f"HTTP Error {e.code}: {e.reason}"
    except Exception as e:
        return False, f"Error: {str(e)}"

# Read URLs and deduplicate
print(f"Reading URLs from {URL_FILE}...")
with open(URL_FILE, 'r') as f:
    all_urls = [line.strip() for line in f if line.strip()]

# Deduplicate while preserving order
seen = set()
unique_urls = []
for url in all_urls:
    if url not in seen:
        seen.add(url)
        unique_urls.append(url)

print(f"Found {len(all_urls)} total URLs")
print(f"After deduplication: {len(unique_urls)} unique URLs")
print(f"Importing to {BASE_URL}")
print(f"Tag: {TAG}")
print(f"Using system default fetch method\n")

success_count = 0
fail_count = 0
failed_urls = []

for i, url in enumerate(unique_urls, 1):
    print(f"[{i}/{len(unique_urls)}] Adding {url[:60]}{'...' if len(url) > 60 else ''}", end=' ')
    
    success, message = add_watch(url, TAG, API_KEY)
    
    if success:
        print("✓")
        success_count += 1
    else:
        print(f"✗ ({message})")
        fail_count += 1
        failed_urls.append((url, message))
    
    # Delay between requests
    if i < len(unique_urls):
        time.sleep(0.5)
    
    # Longer pause every 10 URLs
    if i % 10 == 0 and i < len(unique_urls):
        print(f"  ... pausing briefly after {i} URLs ...")
        time.sleep(2)

print()
print("=" * 70)
print(f"Import complete: {success_count} succeeded, {fail_count} failed")

if failed_urls:
    print("\nFailed URLs:")
    for url, message in failed_urls[:20]:
        print(f"  - {url}")
        print(f"    Reason: {message}")
    
    if len(failed_urls) > 20:
        print(f"\n  ... and {len(failed_urls) - 20} more")
    
    with open('failed-urls.txt', 'w') as f:
        for url, message in failed_urls:
            f.write(f"{url}\n")
    print("\nFailed URLs saved to failed-urls.txt")
