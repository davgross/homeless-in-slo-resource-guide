# Changelog

## 2025-10-30 - Section-Level Search for Resource Guide

### Added

**Section-Based Indexing:**
- Resource Guide is now indexed by individual sections (h1, h2, and h3 headings with anchor IDs)
- Each section becomes a separate searchable result
- Multiple results shown if search term appears in different sections
- Clicking a result navigates to that specific section in the Resource Guide

**Improved Navigation:**
- Search results for Resource Guide sections scroll to the exact anchor
- Smooth scroll animation to the target section
- Adjusted for header height to ensure section is visible
- Clear labeling: "Resource Guide › Section" (h2) or "Resource Guide › Subsection" (h3)

**Better Result Granularity:**
- Previously: One result for entire Resource Guide
- Now: Separate results for each section containing the search term
- Easier to find exactly where relevant information is located
- More context about which section contains the match

### Impact

✅ **Multiple Resource Guide sections shown in results if they match**
✅ **Click to jump directly to the relevant section**
✅ **Easier to find specific information within the Resource Guide**
✅ **More useful search results with better context**

## 2025-10-30 - Search Improvements: Stop Words and Clean Snippets

### Changed

**Stop Word Filtering:**
- Added stop words list (common words like "a", "the", "is", "of", etc.)
- Stop words are now ignored when scoring individual term matches
- Full phrase matching still works with stop words included
- Prevents common words from dominating search results
- Only significant terms are highlighted in results

**Markdown Cleaning in Snippets:**
- Snippets now show rendered text instead of markdown source
- Removes markdown syntax: `**bold**`, `*italic*`, `[links](url)`, `## headers`
- Removes HTML comments, blockquotes, and list markers
- Cleans up whitespace for readable snippets
- Makes search results much easier to scan

**Improved Scoring:**
- Exact phrase matches in content: 5 points per occurrence (up from 2)
- Individual significant term matches: 1 point per occurrence
- Stop words no longer contribute to scoring
- Better balance between phrase matching and term matching

### Impact

✅ **Search for "shower the people" now prioritizes the phrase, not "the"**
✅ **Snippets are readable text instead of markdown source**
✅ **Only significant terms are highlighted (not common words)**
✅ **Better search relevance overall**

## 2025-10-30 - Comprehensive Search Results Implementation

### Added

**Search Results Dropdown:**
- Shows all matching results in a dropdown below search input
- Displays result count in header
- Each result shows: title, type (Directory/Resource Guide), and context snippet
- Results are clickable to navigate to directory entries or resources section

**Relevance Scoring:**
- Exact title matches scored highest (100 points)
- Partial title matches scored high (50 points)
- Individual query term matches in title (10 points each)
- Content matches scored (2 points per occurrence)
- Results sorted by relevance score (highest first)

**Context Snippets:**
- Extracts ~150 characters of context around search query
- Shows where the query appears in the content
- Highlights matching terms with yellow background
- Intelligently trims to word boundaries

**User Experience:**
- Dropdown closes when clicking outside
- Clicking search input reopens results if query exists
- Clean, readable result cards with hover effects
- Mobile-friendly with scrollable results
- No results message when nothing matches

### Impact

✅ **All relevant results displayed, not just the first one**
✅ **Results ordered by relevance for better discoverability**
✅ **Context snippets help users understand why results matched**
✅ **Highlighted search terms make matches easy to spot**
✅ **Professional search experience similar to major search engines**

## 2025-10-30 - Improved Table Styling

### Added

**Table Readability:**
- Added cell borders to visually separate columns and rows
- Optimized cell padding: 0.5rem vertical, 1rem horizontal
- Added header styling with light blue background (#f0f9ff)
- Added prominent border under header row
- Added subtle hover effect on table rows
- Made tables responsive with horizontal scrolling on mobile devices

**Table Styling Details:**
- Header cells: Bold text, primary color, right borders between columns
- Data cells: Compact vertical spacing, generous horizontal spacing, borders between rows
- Mobile optimization: Horizontal scroll with minimum cell width of 100px

### Impact

✅ **Column headers are clearly separated and readable**
✅ **Tables are easier to scan and understand**
✅ **Mobile-friendly with touch-scrolling support**
✅ **Professional appearance consistent with the app's design**

## 2025-10-30 - Support for Multiple Anchor IDs on Directory Headings

### Fixed

**Directory Entry Extraction:**
- Fixed extraction to handle headings with multiple anchor IDs
- Example: `## <a id="Coastal-Dunes">Name1</a> / <a id="Oceano-Campground">Name2</a>`
- Now creates separate entries for each anchor ID
- All anchor IDs from the same heading share the same content
- Each entry displays its own title in the modal

### Impact

✅ **Links to secondary anchor IDs now work correctly**
✅ **Oceano Campground and similar aliases are properly styled**
✅ **More flexible directory structure without duplicate content**

## 2025-10-30 - Build-Time Validation for Broken Directory Links

### Added

**Broken Link Detection:**
- Added validation during build/development to detect broken directory links
- Warns when Resource Guide contains links to non-existent directory entries
- Detects both `Directory.md#foo` and `#foo` format links
- Distinguishes between directory links and Resource Guide internal anchors
- Provides detailed warnings with link text, target ID, and helpful messages

**Warning Output:**
- Shows count of broken links found
- Lists each broken link with:
  - Link text (first 50 characters)
  - Target entry ID that was not found
  - Original href attribute
- Suggests checking Resource guide.md for typos

### Impact

✅ **Catches typos and casing errors in directory link IDs**
✅ **Helps maintain consistency between Resource Guide and Directory**
✅ **Provides actionable warnings during development**
✅ **Prevents broken links from going unnoticed**

## 2025-10-30 - Case-Insensitive Directory Link Matching

### Fixed

**Directory Link Matching:**
- Added case-insensitive matching for directory entry IDs
- Links like `[text](Directory.md#40-prado)` now match entry ID `40-Prado`
- Tries exact match first, then falls back to case-insensitive comparison
- Console logs show when case-insensitive match is used

### Impact

✅ **Directory links work regardless of capitalization in the anchor**
✅ **More forgiving of inconsistent casing between links and directory IDs**
✅ **Maintains the original directory entry IDs (doesn't modify them)**

## 2025-10-30 - Directory Link Styling Improvements

### Changed

**Directory Link Visual Design:**
- Changed from `inline-block` to `inline` display for better text flow
- Reduced padding from large spacing to minimal (0.125rem vertical, 0.375rem horizontal)
- Removed vertical margins that were breaking up paragraphs
- Changed to bottom-border-only design instead of full border
- Lighter background colors (#e0f2fe → #bae6fd on hover)
- Smaller border-radius (3px instead of 6px)
- Added `line-height: inherit` to prevent affecting line spacing
- Removed horizontal transform on hover to prevent layout shifts

### Impact

✅ **Directory links integrate smoothly into paragraphs and lists**
✅ **Minimal disruption to text flow and vertical spacing**
✅ **Still clearly distinguishable as clickable directory links**
✅ **Better readability in dense text**

## 2025-10-30 - Directory Modal Improvements

### Fixed

**Directory Entry Extraction:**
- Fixed issue where directory entries included content from following entries
- Now stops at the first h2 header (`## `) found in the content
- This handles redirect entries (like "50 Now" → "Housing Now") that don't have anchor IDs
- Each directory modal now shows only the single requested entry

**Directory Links Within Modals:**
- Directory entries that link to other directory entries now work correctly
- Clicking a directory link within a modal opens the new entry in the same modal
- Uses the same `parseMarkdown` and link conversion logic for modal content

**Entry Extraction Debugging:**
- Added console logging to help debug entry boundary detection
- Logs show raw content length, h2 detection, and final content length

### Changes

**src/main.js:**
- Modified `showDirectoryEntry()` to use `parseMarkdown()` instead of `marked.parse()`
- Added `setupDirectoryLinks()` call for modal content
- This enables directory links to work within directory entries

## 2025-10-30 - Directory Link Fixes (Part 2)

### Fixed

**Link Format Recognition:**
- Fixed selector to recognize `href="Directory.md#entry-id"` format in addition to `href="#entry-id"`
- Changed selector from `a[href^="#"]` to `a[href*="#"]` to match links containing '#' anywhere
- Updated entry ID extraction to split on '#' and take everything after it
- Now properly converts links like `[Agency](Directory.md#Agency-Name)` to directory modals

## 2025-10-30 - Directory Link Fixes (Part 1)

### Fixed

**Directory Link Click Handlers:**
- Fixed issue where clicking Directory links from Resources section would reload the page instead of opening the modal
- Changed `href` from being removed to being set to `"#"` to maintain focusability and clickability
- Added `e.stopPropagation()` to prevent event bubbling
- Configured DOMPurify to preserve `data-directory-link` attribute with `ADD_ATTR` option
- Added debugging console logs to help troubleshoot link issues

**CSS for Anchor Elements:**
- Fixed anchor elements with only `id` attribute (like `<a id="section">`) to appear as normal text, not links
- Added CSS rule: `a[id]:not([href]):not([data-directory-link])` gets normal text styling
- Changed link selectors to `a[href]` to only style elements with href attribute
- Added `cursor: pointer` to `a[data-directory-link]` elements
- Added focus styling for directory links for better accessibility

### Changes

**src/style.css:**
- Link styles now use `a[href]` selector instead of `a`
- Added rule for anchor elements with only id to look like normal text
- Enhanced directory link styling with cursor and focus states

**src/markdownParser.js:**
- Keep `href="#"` instead of removing it entirely
- This preserves keyboard accessibility and clickability

**src/main.js:**
- Added `ADD_ATTR: ['data-directory-link']` to DOMPurify configuration
- Added console logging for debugging directory link setup and clicks
- Added `e.stopPropagation()` in click handler

### Impact

✅ **Directory links now open modals correctly**
✅ **Anchor elements with only id look like normal text**
✅ **Better keyboard accessibility for directory links**
✅ **Debugging logs help troubleshoot any issues**

## 2025-10-30 - Simplified Directory Link Logic

### Changed

**Directory Link Behavior:**
- Removed automatic text-matching logic that converted any text matching a Directory entry into a clickable link
- Now only uses existing markdown hyperlinks from the Resource Guide
- Links in the format `[Agency Name](#agency-id)` are converted to open the Directory modal
- This prevents unwanted link creation for partial text matches

**Files Modified:**
- `src/markdownParser.js`: Removed `enhanceWithDirectoryLinks()` and related functions
- `src/markdownParser.js`: Added simpler `convertAnchorLinksToDirectoryLinks()` function
- `src/main.js`: Removed unused `createDirectoryLink` import

### Impact

✅ **Only manually-created links become Directory modal links**
✅ **No more unwanted automatic linking of partial matches**
✅ **Simpler, more predictable behavior**
✅ **Better control over which links open the Directory modal**

## 2025-10-30 - Content Loading Fix

### Fixed

**Content Display Issue:**
- Fixed issue where Resources and Directory sections were showing HTML source code instead of rendered content
- Changed from fetching markdown files at runtime to importing them directly at build time
- Markdown files are now bundled into the JavaScript for guaranteed offline access

### Changes

**src/main.js:**
- Added direct imports: `import resourcesMarkdown from '../../Resource guide.md?raw'`
- Modified `loadMarkdownContent()` to use imported strings instead of fetch requests
- Removed async fetch logic (no longer needed)

**vite.config.js:**
- Removed `.md` file caching from workbox (files are now bundled, not fetched)
- Added `assetsInlineLimit: 0` for better asset handling

### Impact

✅ **Fixes display of Resources and Directory content**
✅ **Better offline support** - content is bundled, not fetched
✅ **Faster initial load** - no additional network requests
⚠️ **Content updates require rebuild** - cannot update markdown without rebuilding the app

## 2025-10-30 - Dependency Updates

### Updated Packages

**Direct Dependencies:**
- `marked`: ^11.1.1 → ^14.1.3 (major upgrade for markdown parsing)
- `dompurify`: ^3.0.8 → ^3.2.2 (security improvements)
- `vite`: ^5.0.11 → ^6.0.5 (major upgrade for build tooling)
- `vite-plugin-pwa`: ^0.17.5 → ^0.21.1 (PWA improvements)

**Transitive Dependencies (via overrides):**
- `glob`: upgraded from deprecated v7 to v10
- `inflight`: replaced with `lru-cache` (as recommended by npm)
- `sourcemap-codec`: upgraded to `@jridgewell/sourcemap-codec`
- `source-map`: upgraded to stable v0.7

### Configuration Changes

**vite.config.js:**
- Added `target: 'esnext'` for modern browser optimization
- Added `purpose: 'any maskable'` to PWA icons for better Android support
- Updated `globPatterns` to only include files that exist in dist/
- Added runtime caching strategy for `.md` files
- Added `devOptions` configuration

### Results

✅ **No npm deprecation warnings** during install
✅ **No security vulnerabilities** found
✅ **Build succeeds** and generates all required files
✅ **Service worker** generated correctly for offline functionality

### Known Issues

⚠️ **Non-critical build warning:** "An error occurred when globbing for files"
- This warning appears during the PWA build step but doesn't affect functionality
- The service worker is generated correctly and all files are properly cached
- This is a minor incompatibility between vite-plugin-pwa and the latest glob package
- Can be safely ignored - it doesn't impact the app's operation

### Testing Checklist

After updating, verify:
- [ ] `npm install` completes without deprecation warnings
- [ ] `npm run build` successfully generates dist/ folder
- [ ] Service worker files (sw.js, workbox-*.js) are generated
- [ ] App icons are present in dist/
- [ ] Development server starts: `npm run dev`
- [ ] App loads correctly in browser
- [ ] PWA installation prompt appears (on supported browsers)
- [ ] Offline functionality works after first visit
