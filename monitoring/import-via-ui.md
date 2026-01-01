# Importing URLs via Web Interface

The Changedetection.io API requires authentication. The easiest way to import URLs is through the web interface.

## Method 1: Manual URL Import via Web UI (Recommended for Initial Setup)

### Step 1: Access Changedetection.io

Open your browser to: **http://localhost:5000**

### Step 2: Add URLs One by One

1. Click the **"+ Watch"** button (green plus icon)
2. Paste a URL from `source-urls.txt`
3. Add tag: `resource-guide`
4. Click **"Save"**
5. Repeat for additional URLs

**Note:** This method is tedious for 856 URLs, but works without any API setup.

## Method 2: Enable API Access and Use Import Script

### Step 1: Enable API in Changedetection.io

1. Open http://localhost:5000
2. Go to **Settings** (gear icon)
3. Under **"API"** section, enable **"Enable API"**
4. **Optionally** create an API token if you want authentication:
   - Click **"Generate API Token"**
   - Copy the token
5. Click **"Save"**

### Step 2: Run Import Script with API Token (if using authentication)

If you created an API token:

```bash
cd monitoring

# Method A: Set environment variable
export CHANGEDETECTION_TOKEN="your-token-here"
python3 import-urls-with-auth.py

# Method B: Pass as parameter
python3 import-urls-with-auth.py --token "your-token-here"
```

If you just enabled the API without a token:

```bash
cd monitoring
python3 import-urls.py
```

## Method 3: Import from File (Bulk Import)

Changedetection.io supports importing from a text file via the web UI:

### Step 1: Prepare Import File

The `source-urls.txt` file is already in the correct format (one URL per line).

### Step 2: Import via Web UI

1. Open http://localhost:5000
2. Click on **Settings** (gear icon)
3. Look for **"Import"** or **"Bulk Operations"** section
4. Upload `source-urls.txt` or paste the URLs
5. Set default tag to: `resource-guide`
6. Click **"Import"**

**Note:** Depending on the Changedetection.io version, the bulk import feature may or may not be available.

## Method 4: Import Smaller Batches

If bulk import isn't available and manual one-by-one is too slow:

### Create Batch Files

```bash
cd monitoring

# Split URLs into batches of 50
split -l 50 source-urls.txt batch-
# This creates: batch-aa, batch-ab, batch-ac, etc.

# Or create custom batches
head -50 source-urls.txt > batch-001.txt
tail -n +51 source-urls.txt | head -50 > batch-002.txt
# etc.
```

### Import Each Batch

1. Enable API (see Method 2)
2. Run import script on each batch:

```bash
python3 import-urls.py --url-file batch-aa
python3 import-urls.py --url-file batch-ab
# etc.
```

## Troubleshooting

### "403 Forbidden" when using import script

- The API is not enabled
- **Solution:** Go to Settings → Enable API → Save

### "401 Unauthorized" when using import script

- API is enabled but requires a token
- **Solution:** Generate API token in Settings and pass it to the script

### Import script hangs or times out

- Too many URLs at once
- **Solution:** Import in smaller batches (50-100 URLs at a time)

### Can't find API settings

- Some versions of Changedetection.io may have different UI
- **Solution:** Check Settings → Advanced Settings or update to latest version

## Next Steps

After importing URLs:

1. **Set check interval**: Settings → "Check every" → `24h` (or your preference)
2. **Configure notifications**: Settings → Notifications → Add email/webhook
3. **Run initial check**: Click "Check Now" to establish baselines
4. **Fine-tune selectors**: See SELECTOR-GUIDE.md for details

## Quick Reference

| Task | Location |
|------|----------|
| Access web UI | http://localhost:5000 |
| Add single URL | Click "+ Watch" button |
| Enable API | Settings → API → Enable |
| Generate token | Settings → API → Generate Token |
| Import file location | `monitoring/source-urls.txt` |
| Import script | `monitoring/import-urls.py` |
