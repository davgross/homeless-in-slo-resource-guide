#!/usr/bin/env python3
"""
Fix Page.goto/browser closed errors by switching watches to plain HTTP.

Sites that likely need JavaScript (Calendly, ArcGIS, interactive portals)
are kept on browser rendering.
"""
import json
from urllib.request import Request, urlopen
import time

API_KEY = "4d5dd39ccb65b8a4530cfe3e34d4f32c"
BASE_URL = "http://localhost:5000"

# Sites that likely need JavaScript rendering
JS_NEEDED_PATTERNS = [
    'calendly.com',
    'docs.google.com',
    'forms.google.com',
    'arcgis.com',
    'storymaps',
    'findhelp.org',
    'rec1.com',
    'toastmastersclubs.org',
    'myresourcedirectory.com',
    'citizenserviceportal.com',
    'energyinsight.pge.com',
]

# Read-only fields that must be removed before updating
READONLY_FIELDS = ['last_changed', 'last_checked', 'last_error', 'link', 'viewed',
                   'date_created', 'last_notification_error', 'browser_steps_last_error_step',
                   'remote_server_reply', 'page_title', 'history']

def get_watches():
    """Get all watches from API."""
    headers = {'x-api-key': API_KEY}
    req = Request(f"{BASE_URL}/api/v1/watch", headers=headers)
    with urlopen(req, timeout=30) as response:
        return json.loads(response.read())

def get_full_watch(watch_id):
    """Get full watch data including all fields."""
    headers = {'x-api-key': API_KEY}
    req = Request(f"{BASE_URL}/api/v1/watch/{watch_id}", headers=headers)
    with urlopen(req, timeout=30) as response:
        return json.loads(response.read())

def update_watch(watch_id, updates):
    """Update a watch via API with minimal payload."""
    update_req = Request(
        f"{BASE_URL}/api/v1/watch/{watch_id}",
        data=json.dumps(updates).encode('utf-8'),
        headers={'Content-Type': 'application/json', 'x-api-key': API_KEY},
        method='PUT'
    )

    with urlopen(update_req, timeout=30) as resp:
        return resp.status == 200

def needs_javascript(url):
    """Check if URL likely needs JavaScript rendering."""
    return any(p in url.lower() for p in JS_NEEDED_PATTERNS)

def main():
    print("Fetching watches...")
    watches = get_watches()

    # Find watches with Page.goto errors
    page_goto_errors = []
    for watch_id, w in watches.items():
        err = w.get('last_error', '')
        if err and ('Page.goto' in str(err) or 'browser has been closed' in str(err)):
            url = w.get('url', '')
            page_goto_errors.append((watch_id, url))

    if not page_goto_errors:
        print("✓ No watches found with Page.goto errors!")
        return

    print(f"Found {len(page_goto_errors)} watches with Page.goto errors\n")

    # Categorize
    switch_to_http = []
    keep_browser = []

    for watch_id, url in page_goto_errors:
        if needs_javascript(url):
            keep_browser.append((watch_id, url))
        else:
            switch_to_http.append((watch_id, url))

    print(f"Will switch to plain HTTP: {len(switch_to_http)} watches")
    print(f"Will keep on browser (needs JS): {len(keep_browser)} watches\n")

    if keep_browser:
        print("Sites kept on browser rendering:")
        for wid, url in keep_browser:
            print(f"  {url[:70]}")
        print()

    # Switch watches to HTTP
    switched = 0
    errors = 0

    print(f"Switching {len(switch_to_http)} watches to plain HTTP...\n")

    for i, (watch_id, url) in enumerate(switch_to_http, 1):
        try:
            if update_watch(watch_id, {'fetch_backend': 'html_requests'}):
                domain = url.split('/')[2] if '://' in url else url.split('/')[0]
                print(f"[{i}/{len(switch_to_http)}] ✓ {domain[:50]}")
                switched += 1
            else:
                print(f"[{i}/{len(switch_to_http)}] ✗ Error: {url[:50]}")
                errors += 1
        except Exception as e:
            print(f"[{i}/{len(switch_to_http)}] ✗ {str(e)[:60]}")
            errors += 1

        time.sleep(0.1)

    print("\n" + "="*70)
    print(f"Complete: {switched} switched to HTTP, {errors} errors")
    print(f"\n{len(keep_browser)} watches kept on browser (need JavaScript)")
    print("\nRe-run checks to verify the changes work.")
    print("If any sites return empty content, switch them back to browser.")

if __name__ == '__main__':
    main()
