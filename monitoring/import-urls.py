#!/usr/bin/env python3
"""
Import URLs from source-urls.txt into Changedetection.io

Usage:
    python3 import-urls.py [--base-url BASE_URL]

The script will read URLs from source-urls.txt and add them as watches
to your Changedetection.io instance.
"""

import sys
import json
import time
import argparse
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError


def add_watch(base_url, url, tag="resource-guide"):
    """Add a single URL to Changedetection.io"""
    api_url = f"{base_url}/api/v1/watch"

    # Basic watch configuration
    # You can customize these settings per your needs
    watch_data = {
        "url": url,
        "tag": tag,
        "fetch_backend": "html_webdriver",  # Use browser for JavaScript rendering
        "check_unique_lines": True,  # Only alert on new/changed lines
        "extract_title_as_title": True,  # Use page title as watch title
        "trigger_check": False,  # Don't trigger immediate check
    }

    data = json.dumps(watch_data).encode('utf-8')
    req = Request(
        api_url,
        data=data,
        headers={'Content-Type': 'application/json'},
        method='POST'
    )

    try:
        with urlopen(req, timeout=10) as response:
            if response.status == 201:
                return True, "Success"
            else:
                return False, f"HTTP {response.status}"
    except HTTPError as e:
        return False, f"HTTP Error {e.code}: {e.reason}"
    except URLError as e:
        return False, f"URL Error: {e.reason}"
    except Exception as e:
        return False, f"Error: {str(e)}"


def main():
    parser = argparse.ArgumentParser(
        description='Import URLs into Changedetection.io'
    )
    parser.add_argument(
        '--base-url',
        default='http://localhost:5000',
        help='Base URL of Changedetection.io instance (default: http://localhost:5000)'
    )
    parser.add_argument(
        '--tag',
        default='resource-guide',
        help='Tag to apply to all watches (default: resource-guide)'
    )
    parser.add_argument(
        '--batch-size',
        type=int,
        default=10,
        help='Number of URLs to import at once before pausing (default: 10)'
    )
    parser.add_argument(
        '--delay',
        type=float,
        default=0.5,
        help='Delay in seconds between each URL import (default: 0.5)'
    )
    parser.add_argument(
        '--url-file',
        default='source-urls.txt',
        help='File containing URLs to import (default: source-urls.txt)'
    )

    args = parser.parse_args()

    # Read URLs from file
    try:
        with open(args.url_file, 'r') as f:
            urls = [line.strip() for line in f if line.strip()]
    except FileNotFoundError:
        print(f"Error: {args.url_file} not found")
        sys.exit(1)

    print(f"Found {len(urls)} URLs to import")
    print(f"Importing to {args.base_url}")
    print(f"Tag: {args.tag}")
    print()

    success_count = 0
    fail_count = 0
    failed_urls = []

    for i, url in enumerate(urls, 1):
        print(f"[{i}/{len(urls)}] Adding {url[:60]}{'...' if len(url) > 60 else ''}", end=' ')

        success, message = add_watch(args.base_url, url, args.tag)

        if success:
            print("✓")
            success_count += 1
        else:
            print(f"✗ ({message})")
            fail_count += 1
            failed_urls.append((url, message))

        # Delay between requests to avoid overwhelming the server
        if i < len(urls):
            time.sleep(args.delay)

        # Longer pause every batch_size URLs
        if i % args.batch_size == 0 and i < len(urls):
            print(f"  ... pausing briefly after {args.batch_size} URLs ...")
            time.sleep(2)

    print()
    print("=" * 70)
    print(f"Import complete: {success_count} succeeded, {fail_count} failed")

    if failed_urls:
        print("\nFailed URLs:")
        for url, message in failed_urls[:20]:  # Show first 20 failures
            print(f"  - {url}")
            print(f"    Reason: {message}")

        if len(failed_urls) > 20:
            print(f"\n  ... and {len(failed_urls) - 20} more")

        # Save failed URLs to a file
        with open('failed-urls.txt', 'w') as f:
            for url, message in failed_urls:
                f.write(f"{url}\n")
        print("\nFailed URLs saved to failed-urls.txt")


if __name__ == '__main__':
    main()
