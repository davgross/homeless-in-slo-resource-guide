# Resource Guide Website Monitoring

This directory contains a self-hosted, free setup for monitoring all the source websites referenced in the Resource Guide using [Changedetection.io](https://changedetection.io/).

## Overview

The Resource Guide references 856+ unique websites as sources for information. This monitoring setup helps you:

- Track when source websites change their content
- Get notified when contact info, hours, or services are updated
- Identify broken or moved pages
- Keep the Resource Guide up-to-date with minimal manual checking

## What's Included

- **`docker-compose.yml`**: Docker setup for Changedetection.io with browser support
- **`import-urls.py`**: Python script to bulk-import all source URLs
- **`source-urls.txt`**: List of 856 extracted source URLs from the Resource Guide
- **`SELECTOR-GUIDE.md`**: Comprehensive guide for fine-tuning what content to monitor

## Prerequisites

### Required
- **Docker** and **Docker Compose** installed
- At least 2GB RAM available for Docker containers
- Python 3 (for the import script)

### Installing Docker on Ubuntu

```bash
# Update package index
sudo apt update

# Install Docker
sudo apt install docker.io docker-compose

# Add your user to docker group (to run without sudo)
sudo usermod -aG docker $USER

# Log out and back in for group membership to take effect
```

## Quick Start

### 1. Start Changedetection.io

```bash
cd monitoring
docker-compose up -d
```

This starts two containers:
- **changedetection**: The main monitoring application (port 5000)
- **playwright-chrome**: Headless browser for JavaScript-heavy sites

Wait about 30 seconds for the containers to fully start.

### 2. Access the Web Interface

Open your browser to: **http://localhost:5000**

On first access, you may be prompted to set a password. This is optional but recommended if the port might be accessible to others on your network.

### 3. Enable API Access

Before importing URLs, enable the API:

1. Open http://localhost:5000
2. Go to **Settings** (gear icon)
3. Scroll to **"API"** section
4. Check **"Enable API"**
5. Click **"Save"**

**Optional:** For added security, you can generate an API token in the same section.

### 4. Import All Source URLs

**Option A: Using the import script (recommended)**

```bash
cd monitoring
python3 import-urls-with-auth.py
```

If you created an API token:
```bash
python3 import-urls-with-auth.py --token "your-token-here"
```

This will import all 856 URLs from `source-urls.txt`. The process takes about 10-15 minutes.

**Option B: Manual import via web UI**

See **[import-via-ui.md](import-via-ui.md)** for detailed instructions on importing through the web interface.

The import script:
- Adds each URL as a "watch" in Changedetection.io
- Tags them all with "resource-guide" for easy filtering
- Uses browser rendering for JavaScript-heavy sites
- Pauses between requests to avoid overwhelming the server

**Note:** If the script fails with "403 Forbidden" errors, make sure you enabled the API in Settings (step 3 above).

### 4. Configure First Check

In the web interface:
1. Go to **Settings** (gear icon)
2. Set **"Check every"** to your preferred interval (e.g., `24h` for daily checks)
3. Set **"Maximum workers"** to `2` or `3` (don't overload your system)
4. Click **"Save"**

### 5. Start Monitoring

Click **"Check Now"** on the main page to run the first check on all watches. This initial check establishes the baseline for future change detection.

## Customizing What to Monitor

By default, Changedetection.io monitors the entire page, which can lead to false positives from:
- Navigation menus changing
- Advertisements rotating
- Timestamps updating
- Social media widgets

See **[SELECTOR-GUIDE.md](SELECTOR-GUIDE.md)** for detailed instructions on:
- Using CSS selectors to monitor only relevant content
- Using XPath expressions for complex selections
- Filtering out dynamic elements
- Testing your selectors
- Practical examples for different types of websites

**Quick example:**
1. Click on any watch in the web interface
2. Click **"Edit"**
3. In the **"CSS/JSON/XPath Filter"** field, enter: `main` (to monitor only the main content area)
4. Click **"Preview"** to see what content matches
5. Adjust and save

## Managing Notifications

### Email Notifications

1. Go to **Settings → Notifications**
2. Enter your email address in **"Email notification URLs"**
3. Configure SMTP settings (you can use Gmail, see below)
4. Test the notification

**Using Gmail for notifications:**
```
SMTP Server: smtp.gmail.com
Port: 587
Username: your-email@gmail.com
Password: [App-specific password]
```

You'll need to create an [App Password](https://support.google.com/accounts/answer/185833) in your Google account settings.

### Webhook Notifications

For integration with other tools (Slack, Discord, etc.):
1. Go to **Settings → Notifications**
2. Add a webhook URL in **"Webhook notification URLs"**
3. See [Changedetection.io webhook docs](https://github.com/dgtlmoon/changedetection.io/wiki/Notifications) for format

## Organizing Your Watches

### Using Tags

All imported URLs are tagged with `resource-guide`. You can add more tags:
- `contact-info` - Watches for pages with contact information
- `hours` - Pages listing hours of operation
- `government` - Government (.gov) sites
- `high-priority` - Critical services

To filter by tag: Click **"Tags"** in the top menu and select a tag.

### Grouping by Priority

Create different check intervals for different priorities:
1. Edit a watch (or select multiple and click "Edit Selected")
2. Set **"Check every"** to override the global setting
   - High priority: `12h` (check twice daily)
   - Medium priority: `24h` (check daily)
   - Low priority: `7d` (check weekly)

### Bulk Operations

Select multiple watches using checkboxes, then:
- **"Edit Selected"**: Change settings for multiple watches at once
- **"Check Now"**: Trigger immediate check
- **"Delete"**: Remove watches (careful!)
- **"Pause"**: Temporarily stop monitoring
- **"Mark as Viewed"**: Clear the "changed" notification

## Maintenance

### View Logs

```bash
# View container logs
docker-compose logs -f changedetection

# View browser logs
docker-compose logs -f playwright-chrome
```

### Restart Services

```bash
# Restart all containers
docker-compose restart

# Restart just the main app
docker-compose restart changedetection
```

### Stop Monitoring

```bash
# Stop containers (keeps data)
docker-compose down

# Stop and remove all data (CAUTION!)
docker-compose down -v
rm -rf changedetection-data
```

### Update Changedetection.io

```bash
# Pull latest images
docker-compose pull

# Restart with new images
docker-compose up -d
```

### Backup Your Configuration

```bash
# Backup all watches and settings
tar -czf changedetection-backup-$(date +%Y%m%d).tar.gz changedetection-data/
```

### Restore from Backup

```bash
# Stop containers
docker-compose down

# Remove old data
rm -rf changedetection-data

# Extract backup
tar -xzf changedetection-backup-YYYYMMDD.tar.gz

# Restart
docker-compose up -d
```

## Troubleshooting

### Port 5000 Already in Use

Edit `docker-compose.yml` and change the port mapping:
```yaml
ports:
  - "5001:5000"  # Use port 5001 instead
```

Then access at http://localhost:5001

### Container Won't Start

Check logs:
```bash
docker-compose logs changedetection
```

Common issues:
- Insufficient memory (increase Docker memory limit)
- Port conflict (see above)
- Permissions on `changedetection-data/` directory

### Browser Not Working

Some sites require JavaScript rendering. If you see blank content:
1. Edit the watch
2. Change **"Fetching method"** to **"Chrome/Javascript"**
3. Check again

If browser container is having issues:
```bash
docker-compose restart playwright-chrome
```

### Too Many False Positives

See **[SELECTOR-GUIDE.md](SELECTOR-GUIDE.md)** for detailed instructions on:
- Using CSS selectors to monitor specific content
- Filtering out dynamic elements
- Ignoring timestamps and other frequently-changing text

### Import Script Fails

If the import script fails:
1. Make sure Changedetection.io is running (`docker-compose ps`)
2. Check that you can access http://localhost:5000
3. Run with verbose output:
   ```bash
   python3 import-urls.py --delay 1.0
   ```

Failed URLs are saved to `failed-urls.txt` for manual review.

## Advanced Usage

### Re-import New URLs

After updating the Resource Guide with new sources:

```bash
# Re-extract URLs from markdown files
cd /home/dgross/ResourceGuide
grep -o 'Source: https\?://[^[:space:]]*' "Resource guide.md" "Directory.md" 2>/dev/null | sed 's/Source: //' | sort -u > monitoring/source-urls-new.txt

# Import only new URLs
cd monitoring
python3 import-urls.py --url-file source-urls-new.txt
```

### Export Watches

Via the web interface: **Settings → Export**

This creates a JSON file you can:
- Share with others
- Use as a backup
- Import into another Changedetection.io instance

### API Access

Changedetection.io has a REST API at `http://localhost:5000/api/v1/`

Examples:
```bash
# List all watches
curl http://localhost:5000/api/v1/watch

# Get specific watch
curl http://localhost:5000/api/v1/watch/UUID

# Trigger check
curl -X POST http://localhost:5000/api/v1/watch/UUID/trigger
```

### Custom Filters

For advanced filtering, you can use regular expressions in the **"Text must contain"** field:

```regex
(?i)(phone|contact|email|hours)
```

This only triggers alerts if the changed content contains words like "phone", "contact", "email", or "hours".

### Diff Highlighting

Changedetection.io shows you exactly what changed:
- **Green**: New content
- **Red**: Removed content
- **Yellow**: Modified content

You can also view:
- **Side-by-side diff**: Compare old and new versions
- **Text-only diff**: Ignore HTML formatting changes

## Resource Usage

Typical resource consumption:
- **RAM**: ~500MB for changedetection, ~800MB for playwright-chrome
- **Disk**: ~100MB for application, ~10MB for watch data (grows over time as snapshots accumulate)
- **CPU**: Minimal when idle, spikes during checks
- **Network**: Depends on check frequency and number of watches

For 856 URLs checked daily:
- Expect ~2-3 hours total check time (distributed throughout the day)
- ~1-2GB network traffic per day

## Cost Analysis

This setup is **completely free** and runs on your local machine:

- ✅ No cloud hosting fees
- ✅ No SaaS subscription
- ✅ No API usage limits
- ✅ Unlimited watches
- ✅ All data stored locally

**Only cost:** Your computer's electricity (negligible for a lightweight Docker setup)

## Alternative: Cloud Deployment

If you want to run this 24/7 on a server, low-cost options:

- **DigitalOcean Droplet**: $6/month (1GB RAM)
- **Linode Nanode**: $5/month (1GB RAM)
- **AWS EC2 t2.micro**: Free tier eligible (1 year)
- **Oracle Cloud**: Free tier forever (1GB RAM ARM instance)

Setup would be the same (using docker-compose).

## Getting Help

- **Changedetection.io Wiki**: https://github.com/dgtlmoon/changedetection.io/wiki
- **Community Forum**: https://github.com/dgtlmoon/changedetection.io/discussions
- **GitHub Issues**: https://github.com/dgtlmoon/changedetection.io/issues

## Workflow Recommendations

### Weekly Workflow
1. **Monday morning**: Review all changes from the weekend
2. **Throughout the week**: Check notifications as they arrive
3. **Friday**: Update Resource Guide with any verified changes
4. **Monthly**: Review and refine selectors for high-false-positive watches

### Updating the Resource Guide
When a watch detects a change:
1. Click on the watch to see the diff
2. Verify the change on the actual website
3. Update the Resource Guide markdown files
4. Annotate with source URL and date verified
5. Mark the watch as "viewed" in Changedetection.io

### Handling False Positives
1. Identify the cause (ads, timestamps, navigation, etc.)
2. Add a CSS selector to filter that element (see SELECTOR-GUIDE.md)
3. Or add an ignore pattern in "Ignore text"
4. Re-check to verify it works

## Next Steps

1. ✅ Import all URLs (done via `import-urls.py`)
2. ⏳ Let it run for a few days to see what changes are detected
3. 📝 Review the changes and identify false positives
4. 🎯 Fine-tune selectors for high-noise websites (see SELECTOR-GUIDE.md)
5. 🔔 Set up email or webhook notifications
6. 📊 Establish a regular review workflow
7. 📖 Update Resource Guide based on detected changes

## Contributing

If you find good selector patterns that work well for common resource types (government sites, non-profits, etc.), consider documenting them in SELECTOR-GUIDE.md for future reference.
