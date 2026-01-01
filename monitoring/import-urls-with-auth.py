#!/usr/bin/env python3
"""
Import URLs from source-urls.txt into Changedetection.io (with authentication support)

Usage:
    python3 import-urls-with-auth.py [--base-url BASE_URL] [--token TOKEN]

The script will read URLs from source-urls.txt and add them as watches
to your Changedetection.io instance.
"""

import sys
import json
import time
import argparse
import os
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError


def add_watch(base_url, url, tag="resource-guide", api_token=None):
    """Add a single URL to Changedetection.io"""
    api_url = f"{base_url}/api/v1/watch"

    # Basic watch configuration
    watch_data = {
        "url": url,
        "tag": tag,
        "fetch_backend": "html_webdriver",  # Use browser for JavaScript rendering
        "check_unique_lines": True,  # Only alert on new/changed lines
        "extract_title_as_title": True,  # Use page title as watch title
        "trigger_check": False,  # Don't trigger immediate check
    }

    data = json.dumps(watch_data).encode('utf-8')

    headers = {
        'Content-Type': 'application/json',
    }

    # Add API token if provided
    if api_token:
        headers['x-api-key'] = api_token

    req = Request(
        api_url,
        data=data,
        headers=headers,
        method='POST'
    )

    try:
        with urlopen(req, timeout=10) as response:
            if response.status == 201:
                return True, "Success"
            else:
                return False, f"HTTP {response.status}"
    except HTTPError as e:
        if e.code == 403:
            return False, "API access forbidden - enable API in Settings"
        elif e.code == 401:
            return False, "Unauthorized - check API token"
        else:
            return False, f"HTTP Error {e.code}: {e.reason}"
    except URLError as e:
        return False, f"URL Error: {e.reason}"
    except Exception as e:
        return False, f"Error: {str(e)}"


def main():
    parser = argparse.ArgumentParser(
        description='Import URLs into Changedetection.io (with API auth)'
    )
    parser.add_argument(
        '--base-url',
        default='http://localhost:5000',
        help='Base URL of Changedetection.io instance (default: http://localhost:5000)'
    )
    parser.add_argument(
        '--token',
        default=os.environ.get('CHANGEDETECTION_TOKEN'),
        help='API token (or set CHANGEDETECTION_TOKEN env var)'
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

    # Warn if no token provided
    if not args.token:
        print("⚠️  No API token provided. This will only work if:")
        print("   1. API is enabled in Changedetection.io Settings")
        print("   2. No authentication is required")
        print()
        print("If imports fail with 403/401 errors:")
        print("   - Go to http://localhost:5000 → Settings → Enable API")
        print("   - Generate an API token and pass it with --token")
        print()
        response = input("Continue anyway? (y/n): ")
        if response.lower() != 'y':
            print("Exiting...")
            sys.exit(0)
        print()

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
    if args.token:
        print(f"Using API token: {args.token[:10]}...")
    print()

    success_count = 0
    fail_count = 0
    failed_urls = []

    for i, url in enumerate(urls, 1):
        print(f"[{i}/{len(urls)}] Adding {url[:60]}{'...' if len(url) > 60 else ''}", end=' ')

        success, message = add_watch(args.base_url, url, args.tag, args.token)

        if success:
            print("✓")
            success_count += 1
        else:
            print(f"✗ ({message})")
            fail_count += 1
            failed_urls.append((url, message))

            # If first few all fail with auth errors, stop
            if i <= 5 and fail_count == i and ("forbidden" in message.lower() or "unauthorized" in message.lower()):
                print()
                print("❌ All initial imports failing with authentication errors!")
                print()
                print("Please:")
                print("1. Open http://localhost:5000")
                print("2. Go to Settings → Enable API → Save")
                print("3. (Optional) Generate API token and re-run with --token")
                print()
                sys.exit(1)

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
