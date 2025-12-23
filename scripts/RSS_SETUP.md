# RSS Feed Aggregator Setup

This guide explains how to set up the local RSS feed aggregator to monitor news about agencies and services in your resource guide.

## How It Works

The aggregator:
1. Fetches RSS feeds from local news sources (KSBY, Cal Coast News, etc.)
2. Automatically extracts agency names from `Directory.md` as keywords
3. Filters feed items that mention those agencies or keywords
4. Combines them into a single RSS feed file
5. You subscribe to that file in Thunderbird
6. Runs periodically (via cron) to update the feed

**Benefits:**
- Catch policy changes, closures, new programs
- Monitor multiple sources in one place
- Only see items relevant to your resource guide
- Completely local - no cloud services required

## Setup in Thunderbird

### Step 1: Run the Aggregator Once

```bash
cd /home/dgross/ResourceGuide
node scripts/aggregate-feeds.js
```

This creates `~/vivaslo-feed.xml` with the combined feed.

### Step 2: Add Feed Account in Thunderbird

1. Open Thunderbird
2. Go to **File** → **New** → **Feed Account**
3. Enter account name: **VivaSLO Resource Updates**
4. Click **Next** and **Finish**

### Step 3: Subscribe to the Local Feed

1. Right-click the new **VivaSLO Resource Updates** account
2. Select **Subscribe...**
3. In the "Feed URL" field, enter:
   ```
   file:///home/dgross/vivaslo-feed.xml
   ```
4. Click **Add**
5. Click **OK**

### Step 4: Verify It Works

1. Select the **VivaSLO Resource Updates** folder in Thunderbird
2. You should see filtered news items
3. Click any item to read it

**Note:** Thunderbird will check this file every time you restart it or manually refresh feeds.

## Automatic Updates with Cron

To keep the feed updated automatically:

### Option 1: Every 6 Hours

```bash
# Edit your crontab
crontab -e

# Add this line (updates at 6am, noon, 6pm, midnight):
0 */6 * * * cd /home/dgross/ResourceGuide && /usr/bin/node scripts/aggregate-feeds.js >> /tmp/rss-aggregator.log 2>&1
```

### Option 2: Twice Daily

```bash
# Edit your crontab
crontab -e

# Add this line (updates at 8am and 8pm):
0 8,20 * * * cd /home/dgross/ResourceGuide && /usr/bin/node scripts/aggregate-feeds.js >> /tmp/rss-aggregator.log 2>&1
```

### Option 3: Daily at 9am

```bash
# Edit your crontab
crontab -e

# Add this line:
0 9 * * * cd /home/dgross/ResourceGuide && /usr/bin/node scripts/aggregate-feeds.js >> /tmp/rss-aggregator.log 2>&1
```

### Verify Cron Job

```bash
# List your cron jobs
crontab -l

# Check the log after it runs
tail -20 /tmp/rss-aggregator.log
```

## Customizing the Feed

### Add More RSS Feeds

Edit `scripts/feeds-config.json`:

```json
{
  "feeds": [
    {
      "name": "Your Feed Name",
      "url": "https://example.com/feed.rss"
    }
  ]
}
```

### Add Custom Keywords

The aggregator automatically extracts agency names from `Directory.md`, but you can add more keywords:

```json
{
  "keywords": [
    "homeless",
    "shelter",
    "affordable housing",
    "your custom keyword"
  ]
}
```

### Disable Auto-Extraction

If you want to use ONLY your manual keywords:

```json
{
  "autoExtractKeywords": false,
  "keywords": ["keyword1", "keyword2"]
}
```

## Troubleshooting

### Feed not updating in Thunderbird

Thunderbird doesn't auto-refresh file:// feeds. To update:
1. Right-click the feed folder
2. Select **Get Messages**
3. Or restart Thunderbird

### No items showing up

Check if the feed has content:
```bash
grep "<item>" ~/vivaslo-feed.xml | wc -l
```

If 0, try:
- Running the aggregator manually to see errors
- Checking if any feeds are failing
- Reducing the number of keywords (too many = over-filtering)

### Feeds timing out

Some feeds may be slow. You can:
- Remove slow feeds from `feeds-config.json`
- Increase timeout in `aggregate-feeds.js` (line 16)

### Want to see what's being filtered

Run with verbose output:
```bash
node scripts/aggregate-feeds.js 2>&1 | tee /tmp/feed-run.log
```

Check the log to see:
- How many items fetched per feed
- How many items matched your keywords
- Any errors fetching feeds

## Current Feeds

The default configuration includes:
- KSBY Central Coast News
- Cal Coast News
- Mustang News (Cal Poly)
- New Times SLO
- City of SLO News Releases
- City of SLO City Council Agendas
- GLEAN SLO
- SLO Food System Coalition
- SLO Tribune Local News

## Manual Refresh

To manually update the feed anytime:

```bash
cd /home/dgross/ResourceGuide
node scripts/aggregate-feeds.js
```

Then in Thunderbird: Right-click feed → **Get Messages**

## Sources

Based on RSS feeds from:
- [City of SLO RSS Feeds](https://www.slocity.org/services/how-do-i/advanced-components/misc-pages/list-all-rss-feed)
- [Top San Luis Obispo News RSS Feeds](https://rss.feedspot.com/san_luis_obispo_news_rss_feeds/)
- [SLO County Government Feeds](https://slocounty.granicus.com/ViewPublisher.php?view_id=48)
