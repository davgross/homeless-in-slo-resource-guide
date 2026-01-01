# Fixing Browser Timeout Errors

## The Problem

The error "Page.goto: Target page, context or browser has been closed" means:
- Websites are taking too long to load (>60 seconds)
- The Playwright browser is running out of memory (80-89% usage)
- Too many concurrent browser sessions (10 at once)

Current stats show: **67% of checks are timing out** (40 timeouts out of 60 attempts)

## The Solution

Most websites don't need JavaScript rendering. Switch to plain HTTP fetching by default, which is:
- **10-20x faster** (no browser overhead)
- **Uses 95% less memory** (plain HTTP vs full Chrome browser)
- **More reliable** (no browser crashes)

### Steps to Fix:

1. **Open Changedetection.io Settings**
   - Go to http://localhost:5000
   - Click **Settings** (gear icon)

2. **Change Default Fetch Method**
   - Find the section **"Request"** or **"Fetching"**
   - Change **"Fetch method"** or **"Default fetch backend"** from **"Chrome/Javascript"** to **"Basic fast Plaintext/HTTP Client"**
   - Click **Save**

3. **Reduce Concurrent Checks**
   - In Settings, find **"Maximum workers"**
   - Change from default to **2** (reduces memory pressure)
   - Click **Save**

4. **Increase Timeout for Remaining Browser Checks**
   - In Settings, find **"Request timeout"**
   - Change from 60 seconds to **120 seconds**
   - Click **Save**

### For Sites That NEED JavaScript:

If specific sites don't work with plain HTTP (blank content, missing data), manually enable browser rendering:

1. Click on the watch
2. Click **Edit**
3. Under **"Fetching method"**, select **"Chrome/Javascript"**
4. Increase **"Request timeout"** to 120 seconds
5. Click **Save**

Common sites that need JavaScript:
- Google Docs/Forms
- Calendly
- Some interactive government sites
- Single-page applications (SPAs)

### Expected Results After Fix:

- ✅ Checks complete in 5-10 seconds instead of 60+ seconds
- ✅ Memory usage drops to 20-30% instead of 80-89%
- ✅ Zero timeout errors for most sites
- ✅ Faster overall monitoring (can check all 774 sites in ~1 hour instead of 12+ hours)
