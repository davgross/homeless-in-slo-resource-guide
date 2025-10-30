# SLO County Homeless Resource Guide - Web App

A Progressive Web App (PWA) for the SLO County Homeless Resource Guide, providing easy access to resources and services for people experiencing homelessness in San Luis Obispo County.

## Features

- **Mobile-first design** - Optimized for phones, tablets, and desktops
- **Progressive Web App** - Installable, works offline, fast loading
- **Three main sections**:
  - **Resources** - Category-specific pages with descriptive paragraphs
  - **Directory** - Detailed contact information, hours, and specifics for each agency
  - **About** - Information about the guide and how to report errors
- **Smart hyperlinks** - Phone numbers, emails, and addresses are all clickable
- **Directory popup** - Click any organization name in Resources to see full details
- **State persistence** - Returns users to their previous location
- **Search functionality** - Find resources quickly
- **Accessibility features** - Color contrast, screen reader support, keyboard navigation

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- The markdown source files (`Resource guide.md` and `Directory.md`) in the parent directory

### Installation

```bash
cd web-app
npm install
```

### Development Server

```bash
npm run dev
```

This starts a development server at `http://localhost:5173` (or another port if 5173 is busy).

The dev server has:
- Hot module replacement (changes appear instantly)
- Fast refresh
- Source maps for debugging

### Building for Production

```bash
npm run build
```

This creates optimized production files in the `dist/` directory:
- Minified JavaScript and CSS
- Service worker for offline functionality
- PWA manifest
- Optimized assets

### Preview Production Build

```bash
npm run preview
```

This serves the production build locally for testing before deployment.

## Deployment

### Option 1: Traditional Web Server (Apache/Nginx)

1. Build the production files:
   ```bash
   npm run build
   ```

2. Copy the contents of `dist/` to your web server's document root:
   ```bash
   scp -r dist/* user@yourserver:/var/www/html/resource-guide/
   ```

3. Configure your web server:

   **Apache (.htaccess)**:
   ```apache
   # Enable rewrite engine
   RewriteEngine On

   # If an existing file or directory is not found, route to index.html
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule . /index.html [L]

   # Enable gzip compression
   <IfModule mod_deflate.c>
     AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
   </IfModule>

   # Set caching headers
   <IfModule mod_expires.c>
     ExpiresActive On
     ExpiresByType image/jpg "access plus 1 year"
     ExpiresByType image/jpeg "access plus 1 year"
     ExpiresByType image/gif "access plus 1 year"
     ExpiresByType image/png "access plus 1 year"
     ExpiresByType text/css "access plus 1 month"
     ExpiresByType application/javascript "access plus 1 month"
     ExpiresByType text/html "access plus 1 day"
   </IfModule>
   ```

   **Nginx**:
   ```nginx
   server {
     listen 80;
     server_name yoursite.com;
     root /var/www/html/resource-guide;
     index index.html;

     # Gzip compression
     gzip on;
     gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;

     # Try files, fallback to index.html for client-side routing
     location / {
       try_files $uri $uri/ /index.html;
     }

     # Cache static assets
     location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
       expires 1y;
       add_header Cache-Control "public, immutable";
     }

     # Service worker should not be cached
     location /sw.js {
       add_header Cache-Control "no-cache";
       expires 0;
     }
   }
   ```

### Option 2: Static Hosting Services

**Netlify**:
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

**Vercel**:
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

## Updating Content

The app imports content directly from `../Resource guide.md` and `../Directory.md` during the build process. The markdown files are bundled into the JavaScript, so they work offline without any network requests.

**Important**: When you update the markdown files:

1. You **must rebuild** the app to include the changes:
   ```bash
   npm run build
   ```

2. Redeploy the updated `dist/` directory to your web server

3. Users will automatically get the new version when they reload the page (the service worker detects the new build and updates automatically)

**Note**: Because the markdown content is bundled into the JavaScript at build time, you cannot update the content without rebuilding and redeploying the app. This is a tradeoff for better performance and guaranteed offline functionality.

## Project Structure

```
web-app/
├── index.html              # Main HTML template
├── package.json            # Dependencies and scripts
├── vite.config.js          # Vite and PWA configuration
├── src/
│   ├── main.js             # App core: routing, state, content loading
│   ├── style.css           # Mobile-first CSS styles
│   ├── linkEnhancer.js     # Smart hyperlinks (phone, email, address)
│   └── markdownParser.js   # Markdown parsing and directory extraction
└── dist/                   # Production build output (generated)
```

## How It Works

### Content Loading

1. On startup, the app fetches `Resource guide.md` and `Directory.md`
2. The Directory is parsed to extract all entries with their IDs, titles, and aliases
3. The Resources content is enhanced with clickable links to Directory entries
4. Both sections are rendered from markdown to HTML

### Directory Links

- Links in the Resource Guide that point to Directory entries are automatically converted to open the Directory modal
- Supported formats:
  - `[Agency Name](#entry-id)` - simple anchor link
  - `[Agency Name](Directory.md#entry-id)` - full path with anchor
- Clicking such a link opens a popup showing the full directory entry
- Only existing markdown hyperlinks are converted - there is no automatic text matching
- This gives you full control over which text becomes a Directory link

### State Persistence

- The app remembers which section you were viewing
- It saves your scroll position in each section
- When you return, it restores your previous location
- State is saved in localStorage

### Progressive Web App (PWA)

- The Vite PWA plugin automatically generates a service worker
- The service worker caches all assets and markdown files for offline use
- Users can install the app on their device (mobile or desktop)
- The app works offline after the first visit

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

## Accessibility

The app follows WCAG 2.1 Level AA guidelines:

- Keyboard navigation support
- ARIA labels for screen readers
- High contrast mode support
- Focus indicators
- Skip links
- Semantic HTML

## Troubleshooting

**Content not loading**:
- Check that `Resource guide.md` and `Directory.md` are in the parent directory
- Check browser console for errors
- Verify file paths in `main.js`

**Service worker not updating**:
- Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
- Clear browser cache
- Check for service worker errors in browser DevTools

**Links not working**:
- Ensure directory entries have proper anchor tags: `<a id="entry-id">Name</a>`
- Check that organization names match between Resources and Directory
- Look for errors in browser console

## Future Enhancements

Possible improvements:

- [ ] Enhanced search with results dropdown
- [ ] Filtering by location/category
- [ ] Favorites/bookmarks feature
- [ ] Print-optimized view
- [ ] Multi-language support
- [ ] Map view of resources
- [ ] Share individual entries

## License

[To be determined based on the content license]

## Contact

[To be filled in with contact information for bug reports and suggestions]
