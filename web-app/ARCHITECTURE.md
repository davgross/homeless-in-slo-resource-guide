# Web App Architecture Documentation

## Overview

This is a Progressive Web App (PWA) built with Vite that provides an offline-capable, mobile-first interface for the SLO County Homeless Resource Guide.
The app bundles markdown content at build time for optimal performance and offline functionality.

## Technology Stack

- **Build Tool**: Vite 6.0.5
- **Markdown Parser**: Marked 14.1.3
- **HTML Sanitizer**: DOMPurify 3.2.2
- **PWA Plugin**: vite-plugin-pwa 0.21.1
- **CSS**: Vanilla CSS with mobile-first approach
- **JavaScript**: ES6+ modules (no framework)

## Architecture Principles

1. **Content is Bundled**: Markdown files are imported at build time as raw text strings
2. **Client-Side Rendering**: All markdown parsing and HTML generation happens in the browser
3. **State Persistence**: LocalStorage saves user position and preferences
4. **Offline-First**: Service worker caches all assets for offline use
5. **Serverless Backend**: Cloudflare Pages Functions and Workers handle feedback emails

## Directory Structure

```
web-app/
├── index.html              # Main HTML template with app shell
├── package.json            # Dependencies and build scripts
├── vite.config.js          # Vite config + PWA manifest
├── map-data-helper.html    # Utility for adding map coordinates
├── src/
│   ├── main.js             # App initialization, routing, state
│   ├── style.css           # All CSS styles
│   ├── markdownParser.js   # Directory entry extraction
│   ├── linkEnhancer.js     # Smart hyperlink conversion
│   ├── feedback.js         # Feedback button & API submission
│   ├── shareButton.js      # Share functionality
│   ├── installPrompt.js    # PWA install prompt handling
│   ├── fontSizeControl.js  # Font size and OpenDyslexic toggle
│   └── strings.js          # UI text strings
├── scripts/                # Build and validation scripts
│   ├── extract-map-data.js # Extract coordinates from markdown
│   └── validate-html.js    # HTML validation script
├── public/                 # Static assets (icons, robots.txt, maps)
│   ├── map-feedback.js     # Shared feedback library for map pages
│   ├── *-map.html          # Map viewer pages (libraries, pantries, naloxone)
│   └── *-data.js           # Auto-generated map coordinate data
├── functions/              # Cloudflare Pages Functions (serverless)
│   ├── api/
│   │   └── feedback.js     # Feedback API endpoint
│   └── _worker-email-sender/  # Email sending Worker
│       ├── index.js        # Worker code
│       ├── wrangler.toml   # Worker configuration
│       └── package.json    # Worker dependencies (mimetext)
└── dist/                   # Production build output
```

## Core Components

### 1. main.js - Application Core

**Purpose**: Initializes the app, manages routing, handles state persistence

**Key Functions**:
- `init()`: Entry point, sets up navigation, search, directory overlay
- `loadMarkdownContent()`: Imports markdown from parent directory
- `showSection(sectionName)`: Shows/hides sections, updates nav state
- `setupNavigation()`: Handles Resources/Directory/About button clicks
- `setupSearch()`: Implements search across all content
- `setupDirectoryOverlay()`: Creates modal popup for directory entries
- `saveState()/restoreState()`: LocalStorage persistence
- `initTOCButton()`: Sets up "Jump to TOC" floating button

**State Object**:
```javascript
{
  currentSection: 'resources',     // Current view
  scrollPositions: {},             // Saved scroll per section
  resourcesContent: '',            // Parsed HTML
  directoryContent: '',            // Parsed HTML
  directoryEntries: Map(),         // ID -> entry mapping
  searchIndex: [],                 // Searchable text
  currentDirectoryEntry: null      // Open modal entry
}
```

### 2. markdownParser.js - Content Processing

**Purpose**: Parses markdown and extracts directory entries

**Key Functions**:
- `parseMarkdown(markdown)`: Converts markdown to sanitized HTML
- `extractDirectoryEntries(markdown)`: Finds all `<a id="...">` anchors in Directory
- `normalizeTitle(title)`: Cleans entry names for matching

**Directory Entry Format**:
```javascript
{
  id: 'entry-id',           // From <a id="entry-id">
  title: 'Organization Name',
  aliases: ['Name', 'Org'],  // Variations for matching
  startLine: 123,           // Line number in markdown
  endLine: 145              // Line number where entry ends
}
```

### 3. linkEnhancer.js - Smart Hyperlinks

**Purpose**: Makes phone numbers, emails, and addresses clickable

**Key Functions**:
- `enhanceLinks(html)`: Main enhancement function
- `enhancePhoneLinks()`: Converts `805-123-4567` to `tel:` links
- `enhanceEmailLinks()`: Converts emails to `mailto:` links
- `enhanceLocationLinks()`: Converts map icons to location handlers

**Special Handling**:
- Preserves existing `<a>` tags
- Handles phone extensions (`x123`)
- Adds ARIA labels for accessibility
- Creates click handlers for map links

### 4. feedback.js - User Feedback System

**Purpose**: Allows users to report errors and suggestions via immediate email sending

**Key Functions**:
- `initFeedback()`: Sets up feedback button and modal
- `openFeedbackModal()`: Shows feedback form
- `handleSubmit()`: Posts feedback data to API endpoint

**Architecture**:
```
User submits form
    ↓
POST /api/feedback (Pages Function)
    ↓
Service Binding to Email Worker
    ↓
Cloudflare Email Routing
    ↓
Email delivered to recipient
```

**Email Content Includes**:
- User's name (optional)
- User's email (optional, for reply)
- Feedback type
- Message content
- Current section/page context
- URL with anchor
- Timestamp

### 5. shareButton.js - Share Functionality

**Purpose**: Enables sharing of pages and entries

**Key Functions**:
- `initShareButton()`: Sets up global share button
- `createSectionShareButton()`: Inline share for sections
- `createDirectoryShareButton()`: Share specific entries
- `copyToClipboard()`: Falls back if Web Share API unavailable

**Share Behavior**:
- Uses Web Share API on mobile
- Falls back to clipboard copy on desktop
- Generates shareable URLs with hash fragments

### 6. installPrompt.js - PWA Installation

**Purpose**: Manages PWA installation prompt and browser-specific instructions

**Key Functions**:
- `initInstallPrompt()`: Sets up install button and event listeners
- `handleInstallClick()`: Triggers native install prompt
- `getInstallInstructions()`: Returns platform-specific install steps
- `detectBrowser()`: Identifies browser/platform for tailored instructions
- `isStandalone()`: Checks if app is already installed

**Browser Detection**:
- iOS Safari (required for iOS installation)
- Chrome (Android and Desktop)
- Firefox (Android and Desktop)
- Edge, Brave, Opera, Samsung Internet
- Provides fallback instructions for unsupported browsers

**Installation Flow**:
```
beforeinstallprompt event → Store deferred prompt → Show install button
User clicks install → Trigger prompt → Handle outcome → Hide button
```

### 7. fontSizeControl.js - Text Size and Font Accessibility

**Purpose**: Allows users to adjust text size and enable OpenDyslexic font

**Key Functions**:
- `initFontSizeControl()`: Sets up font size controls and dyslexic toggle
- `changeFontSize(step)`: Increase/decrease font size
- `resetFontSize()`: Restore default size
- `toggleDyslexicFont(enabled)`: Switch to OpenDyslexic font
- `loadFontSize()/saveFontSize()`: LocalStorage persistence

**Font Size Scale**:
- 8 levels: 80%, 90%, 100%, 110%, 120%, 130%, 140%, 150%
- Default: 100%
- Persisted in localStorage

**Accessibility Features**:
- Visual preview of current size
- Keyboard-accessible controls
- Escape key closes popup
- OpenDyslexic font toggle for dyslexia support

### 8. strings.js - UI Text Management

**Purpose**: Centralizes all user-facing text strings

**Structure**:
```javascript
{
  share: {
    button: { label, title },
    notifications: { success, error, ... }
  },
  feedback: {
    button: { label, title },
    form: { title, labels, placeholders }
  },
  search: { placeholder, noResults },
  toc: { button: { label, title } }
}
```

### 9. style.css - Visual Design

**Key Features**:
- Mobile-first responsive design
- CSS custom properties for theming
- Accessible focus indicators
- Print stylesheet
- High contrast mode support

**Color Palette** (matches Shower the People branding):
- Primary Blue: #3877ff
- Primary Orange: #e75e13
- White: #ffffff
- Plus semantic colors for links, visited, etc.

### 10. Serverless Backend - Feedback Email System

**Purpose**: Sends feedback emails immediately without requiring user's email client

**Architecture**:
```
Pages Function (/api/feedback)
    ↓ (Service Binding)
Email Worker (email-sender-worker)
    ↓ (Email Routing Binding)
Cloudflare Email Routing
    ↓
Recipient Email
```

**Components**:

#### functions/api/feedback.js (Pages Function)
- Receives POST requests from frontend
- Validates and formats feedback data
- Calls email-sender-worker via service binding
- Returns success/error response

#### _worker-email-sender (Cloudflare Worker)
- Uses `mimetext` library to construct RFC-5322 compliant emails
- Sends via Cloudflare Email Routing binding
- Supports Reply-To headers when user provides email
- Handles errors with detailed logging

**Configuration Requirements**:
1. Email Routing enabled for domain
2. Destination email verified in Cloudflare
3. Service binding configured in Pages settings
4. Worker deployed with email binding

### 11. Map Pages - Geographic Resource Visualizations

**Purpose**: Standalone HTML pages displaying resources on interactive OpenStreetMap maps

**Map Pages**:
- `little-free-libraries-map.html` - Community book exchanges
- `little-free-pantries-map.html` - Community food pantries
- `naloxone-locations-map.html` - Naloxone/Narcan access points

**Features**:
- OpenStreetMap with Leaflet.js
- Auto-centers and zooms to show all markers
- Color-coded markers (blue for libraries, orange for pantries, red for naloxone)
- Click markers to see location details
- Feedback button integration via map-feedback.js
- Mobile-responsive design

**Data Source**:
- Coordinate data extracted from markdown files via `extract-map-data.js`
- Auto-generated JavaScript files: `*-data.js`
- Map links in markdown use format: `<a class="map-link" data-lat="..." data-lon="..." data-zoom="..." data-label="...">Map</a>`

### 12. Build Scripts

**Purpose**: Automation scripts for data extraction and validation

#### scripts/extract-map-data.js

**Purpose**: Extracts geographic coordinates from markdown files and generates JavaScript data files for map pages

**How it works**:
1. Reads `Directory.md` and `Resource guide.md`
2. Finds sections by ID (e.g., `Little-Free-Libraries`, `naloxone-narcan`)
3. Extracts all map links with coordinates
4. Parses location names and addresses
5. Generates JavaScript files with location arrays

**Output files**:
- `public/little-free-libraries-data.js`
- `public/little-free-pantries-data.js`
- `public/naloxone-locations-data.js`

**When to run**:
- Automatically runs during `npm run build`
- Can run manually with `npm run extract-map-data`
- Run whenever map coordinates are added/changed in markdown files

#### scripts/validate-html.js

**Purpose**: Validates HTML output for accessibility and correctness

**When to run**:
- Automatically runs after `npm run build` (unless using `build:novalidate`)
- Validates both source `index.html` and built `dist/index.html`

## Data Flow

### App Initialization
```
1. User loads page
   ↓
2. main.js init()
   ↓
3. Import markdown files (build-time)
   ↓
4. Parse markdown to HTML
   ↓
5. Extract directory entries
   ↓
6. Enhance links (phone, email, location)
   ↓
7. Build search index
   ↓
8. Restore saved state (localStorage)
   ↓
9. Show appropriate section
```

### Directory Link Click
```
1. User clicks directory link in Resources
   ↓
2. Event intercepted by main.js
   ↓
3. Extract entry ID from link href
   ↓
4. Look up entry in directoryEntries Map
   ↓
5. Extract entry HTML from full directory
   ↓
6. Show directory overlay modal
   ↓
7. Render entry HTML in modal
   ↓
8. Enhance links in modal content
   ↓
9. Update browser history (optional)
```

### Search Flow
```
1. User types in search box
   ↓
2. Filter searchIndex by query
   ↓
3. Rank results by relevance
   ↓
4. Show dropdown with results
   ↓
5. User clicks result
   ↓
6. Navigate to section/entry
   ↓
7. Close search dropdown
```

## Content Import System

### Build-Time Import
```javascript
// In main.js
import resourcesMarkdown from '../../Resource guide.md?raw';
import directoryMarkdown from '../../Directory.md?raw';
```

**How it works**:
1. Vite's `?raw` suffix imports files as text strings
2. Markdown is bundled into JavaScript at build time
3. No network requests needed at runtime
4. Works offline after first load

**Trade-offs**:
- ✅ Fast loading (no fetch() calls)
- ✅ Guaranteed offline functionality
- ✅ No CORS issues
- ❌ Must rebuild to update content
- ❌ Larger JavaScript bundle

### Directory Entry Format

Entries in Directory.md follow this structure:
```markdown
## <a id="entry-id">Organization Name</a>

- Website: [example.org](https://example.org)
- Location: 123 Main St., City <a href="#" class="map-link" data-lat="35.123" data-lon="-120.456">Map</a>
- Phone: [805-123-4567](tel:+1-805-123-4567)
- Email: [info@example.org](mailto:info@example.org)
- Hours: M-F 9am-5pm
```

**Key Requirements**:
- Must have `<a id="unique-id">` anchor
- ID should be kebab-case
- One ## heading per entry
- Next ## heading marks end of entry

## State Management

### LocalStorage Keys
- `resourceGuideState`: Serialized state object
- Saved on every navigation/scroll
- Restored on page load

### State Persistence
```javascript
// What gets saved
{
  currentSection: 'resources',
  scrollPositions: {
    resources: 1234,
    directory: 567,
    about: 0
  }
}
```

## PWA Features

### Service Worker
- Generated automatically by vite-plugin-pwa
- Caches all static assets
- Provides offline functionality
- Updates automatically on new build

### Manifest (manifest.webmanifest)
```json
{
  "name": "SLO County Homeless Resource Guide",
  "short_name": "SLO Resources",
  "theme_color": "#2c5282",
  "background_color": "#ffffff",
  "display": "standalone",
  "icons": [...]
}
```

### Install Prompt
- Browser automatically shows install prompt
- User can add to home screen
- App runs as standalone application

## Navigation & Routing

### Hash-Based Routing
- `#resources` → Resources section
- `#directory` → Full directory
- `#directory/entry-id` → Specific directory entry
- `#about` → About section

### History Management
- Uses `history.pushState()` for clean URLs
- Handles browser back/forward buttons
- Updates URL without page reload

## Search Implementation

### Index Structure
```javascript
searchIndex = [
  {
    type: 'resource',        // or 'directory'
    section: 'Housing',      // section name
    title: 'Emergency Shelter',
    text: 'full text content...',
    anchor: 'housing'
  },
  // ...
]
```

### Search Algorithm
1. Split query into words
2. Filter entries containing all words (case-insensitive)
3. Rank by:
   - Title matches (highest)
   - Early position in text
   - Multiple matches
4. Return top 10 results

## Accessibility Features

### ARIA Labels
- All interactive elements have labels
- Screen reader announcements for state changes
- Live regions for dynamic content

### Keyboard Navigation
- Tab order follows logical flow
- Enter/Space activate buttons
- Escape closes modals
- Focus indicators visible

### Skip Links
- "Skip to main content" at top
- Hidden until focused
- Jumps past navigation

## Performance Considerations

### Bundle Size
- Main JS bundle: ~150KB (uncompressed)
- CSS: ~20KB
- Total with markdown: ~200-300KB
- Gzip reduces by ~70%

### Optimization Strategies
1. **Code Splitting**: Vite automatically chunks vendor code
2. **Tree Shaking**: Unused code removed
3. **Minification**: JS/CSS minified in production
4. **Caching**: Aggressive service worker caching
5. **Font Loading**: Preconnect to Google Fonts

### Loading Performance
- First Contentful Paint: <1s on 3G
- Time to Interactive: <2s on 3G
- Lighthouse score: 95+ (performance)

## Build Process

### Development
```bash
npm run dev
```
- Starts Vite dev server on port 5173
- Hot module replacement enabled
- Source maps for debugging
- No PWA service worker (for faster reload)

### Production Build
```bash
npm run build
```
1. Extracts map data from markdown (`extract-map-data.js`)
2. Vite bundles all code
3. Imports markdown as raw text
4. Minifies JS and CSS
5. Generates service worker
6. Creates PWA manifest
7. Outputs to `dist/`
8. Validates HTML output (`validate-html.js`)

**Alternative build command**:
```bash
npm run build:novalidate
```
Same as above, but skips the HTML validation step (faster for development iterations).

### Build Output
```
dist/
├── index.html              # Entry point
├── assets/
│   ├── index-[hash].js     # Main bundle
│   └── index-[hash].css    # Styles
├── icon-*.png              # PWA icons
├── manifest.webmanifest    # PWA manifest
├── sw.js                   # Service worker
└── workbox-[hash].js       # Service worker runtime
```

## Deployment

### Requirements
- Static file hosting (any web server)
- HTTPS required for PWA features
- Single-page app routing (all requests → index.html)

### Server Configuration
See README.md for Apache/Nginx configs

### Update Process
1. Edit markdown files in parent directory
2. Run `npm run build`
3. Deploy `dist/` contents to web server
4. Service worker auto-updates clients

## Common Modification Tasks

### Adding a New Section
1. Add button to nav in `index.html`
2. Add section element to main
3. Handle in `showSection()` in main.js
4. Add to state persistence

### Changing Color Scheme
1. Update CSS custom properties in `style.css`
2. Update theme_color in `vite.config.js` manifest
3. Update meta theme-color in `index.html`

### Adding Search Filters
1. Extend search index in `main.js`
2. Add filter UI in `setupSearch()`
3. Modify search algorithm to check filters

### Customizing Email Feedback
1. Edit email template in `feedback.js`
2. Change recipient address
3. Modify included context fields

## Testing

### Manual Testing Checklist
- [ ] All three sections load
- [ ] Directory links open modal
- [ ] Phone/email/address links work
- [ ] Search returns results
- [ ] Share buttons work
- [ ] Feedback opens email
- [ ] TOC button jumps to top
- [ ] State persists on refresh
- [ ] Works offline after first load
- [ ] Install prompt appears (mobile)

### Browser Testing
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS/Android)

## Troubleshooting

### Content Not Loading
- Check file paths in main.js imports
- Verify markdown files exist in parent dir
- Check browser console for errors

### Directory Links Not Working
- Verify `<a id="...">` anchors in Directory.md
- Check that IDs match link hrefs
- Ensure Directory.md structure is correct

### Build Failures
- Run `npm install` to update dependencies
- Check Node.js version (18+ required)
- Clear `node_modules/` and reinstall

### Service Worker Issues
- Hard refresh: Ctrl+Shift+R
- Clear browser cache
- Unregister service worker in DevTools
- Check for service worker errors in console

## Future Enhancement Ideas

- Multi-language support (Spanish)
- Advanced filtering (by location, category)
- Favorites/bookmarks with sync
- Map view of all locations
- Print-optimized individual entries
- Dark mode support
- Voice search integration
- Offline edit suggestions queue

## Dependencies Explanation

### Frontend Dependencies

#### marked (14.1.3)
- Converts markdown to HTML
- Supports GitHub Flavored Markdown
- Configurable with extensions
- Used in: `markdownParser.js`

#### DOMPurify (3.2.2)
- Sanitizes HTML to prevent XSS
- Removes dangerous tags/attributes
- Used after markdown parsing
- Used in: `markdownParser.js`

#### vite (6.0.5)
- Build tool and dev server
- Hot module replacement
- ES modules support
- Tree shaking and minification

#### vite-plugin-pwa (0.21.1)
- Generates service worker
- Creates PWA manifest
- Handles cache strategies
- Enables offline functionality

### Backend Dependencies (Email Worker)

#### mimetext (3.0.27)
- RFC-5322 compliant MIME message builder
- Used to construct properly formatted emails
- Handles headers, encoding, and message structure
- Used in: `functions/_worker-email-sender/index.js`

#### cloudflare:email (built-in)
- Cloudflare's Email Routing API
- Provides EmailMessage class
- Native Workers runtime module
- No separate installation required

## Code Style Guidelines

### JavaScript
- Use ES6+ features
- Prefer `const` over `let`
- Use template literals for strings
- Async/await for async operations
- JSDoc comments for functions

### CSS
- Mobile-first media queries
- CSS custom properties for values
- BEM-like naming for components
- Semantic class names

### Accessibility
- ARIA labels on all interactive elements
- Semantic HTML elements
- Keyboard navigation support
- Focus indicators visible
- Color contrast ratios meet WCAG AA

## Contact & Support

For questions about this architecture:
- See main README.md
- Check CHANGELOG.md for recent changes
- Review git commit history

---

*Last updated: 2025-12-01*
*Document version: 1.1*
