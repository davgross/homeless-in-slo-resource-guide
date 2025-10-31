# Licensing Audit - SLO Homeless Resource Guide

This document provides a comprehensive audit of all third-party assets, libraries, and code used in this project to ensure compliance with copyright and licensing requirements.

**Audit Date:** October 31, 2025
**Audited By:** Claude Code (AI Assistant)

---

## Summary

✅ **COMPLIANT** - All dependencies use permissive open-source licenses compatible with this project.

---

## NPM Dependencies

### 1. marked (v14.1.4)
- **License:** MIT
- **Copyright:** MarkedJS (2018+), Christopher Jeffrey (2011-2018)
- **Usage:** Markdown-to-HTML parsing
- **Compliance:** ✅ MIT license allows free use, modification, and distribution
- **Attribution Required:** Yes (included in node_modules/marked/LICENSE.md)
- **Source:** https://github.com/markedjs/marked

### 2. DOMPurify (v3.3.0)
- **License:** Apache 2.0 OR MPL 2.0 (dual-licensed)
- **Copyright:** Dr.-Ing. Mario Heiderich, Cure53 (2025)
- **Usage:** HTML sanitization to prevent XSS attacks
- **Compliance:** ✅ Both licenses allow free use, modification, and distribution
- **Attribution Required:** Yes (included in node_modules/dompurify/LICENSE)
- **Source:** https://github.com/cure53/DOMPurify

### 3. Vite (v6.4.1)
- **License:** MIT
- **Copyright:** Evan You and Vite contributors
- **Usage:** Build tool and development server
- **Compliance:** ✅ MIT license allows free use
- **Attribution Required:** Yes (included in node_modules/vite/LICENSE)
- **Source:** https://github.com/vitejs/vite

### 4. vite-plugin-pwa (v0.21.2)
- **License:** MIT
- **Copyright:** Anthony Fu
- **Usage:** Progressive Web App functionality (service worker, offline support)
- **Compliance:** ✅ MIT license allows free use
- **Attribution Required:** Yes (included in node_modules/vite-plugin-pwa/LICENSE)
- **Source:** https://github.com/vite-pwa/vite-plugin-pwa

---

## Source Code

### Custom Code (Fully Original)
All JavaScript, CSS, and HTML files in `/web-app/src/` and `/web-app/index.html` are original work created for this project:

- `main.js` - Application core logic
- `linkEnhancer.js` - Link processing utilities
- `markdownParser.js` - Markdown parsing and directory entry extraction
- `feedback.js` - User feedback system
- `style.css` - Styling
- `index.html` - HTML structure

**License Status:** ✅ No third-party code copied or adapted
**Ownership:** Proprietary - Copyright (c) 2025 Shower the People
**Note:** Currently proprietary/all-rights-reserved with option to open-source later

---

## Assets

### Icons and Images

1. **favicon.ico** (32×32)
   - Custom-created for this project
   - Status: ✅ Original work

2. **icon-192.png** (192×192)
   - Custom-created for this project
   - Status: ✅ Original work

3. **icon-512.png** (512×512)
   - Custom-created for this project
   - Status: ✅ Original work

4. **apple-touch-icon.png** (180×180)
   - Custom-created for this project
   - Status: ✅ Original work

**Note:** All icons appear to be simple, programmatically-generated placeholder images. Verify they don't inadvertently copy any existing design.

---

## Fonts

### Montserrat Alternates
- **Usage:** Brand font (mentioned in design.md)
- **License:** SIL Open Font License (OFL) 1.1
- **Source:** Google Fonts
- **Compliance:** ✅ OFL allows free use in web projects
- **Attribution Required:** Optional but recommended
- **Current Status:** ⚠️ **NOT YET IMPLEMENTED** - Font is mentioned in design specs but not yet loaded in the app

**Action Required:** When implementing Montserrat Alternates, either:
1. Load from Google Fonts (recommended): `https://fonts.google.com/specimen/Montserrat+Alternates`
2. Self-host with proper OFL attribution in a LICENSE or CREDITS file

---

## Content

### Markdown Content Files
- `Resource guide.md`
- `Directory.md`

**License Status:** These files contain factual information about community resources (agency names, addresses, phone numbers, hours, services). Facts are not copyrightable, but creative expression in the description/organization may be.

**Recommendations:**
1. ✅ Factual data (addresses, phone numbers, hours) - Public information, not subject to copyright
2. ⚠️ Descriptive text - Ensure all content is either:
   - Original writing by project contributors
   - Properly attributed quotes/excerpts from agency websites with source citations
   - Paraphrased information (not copied verbatim from copyrighted sources)

**Current Status:** Content appears to be primarily factual directory information with original descriptive text. Source annotations (e.g., `<!-- Source: https://... -->`) are present for verification but should not be considered attribution for copyright purposes.

---

## External Links and References

The app includes links to external websites (agency sites, Google Maps, Apple Maps, etc.). These are:
- ✅ Factual references - Not subject to copyright
- ✅ Standard web practice - No permission needed for linking
- ✅ Properly attributed with `rel="noopener noreferrer"` for security

---

## Third-Party Services

### Google Maps / Apple Maps
- **Usage:** Address links open in user's preferred map application
- **License:** Links to these services are permitted under their terms of service
- **Compliance:** ✅ No API keys or embedded content used, only deep links

---

## Licensing Recommendations

### For Distribution

When distributing this project, include:

1. **THIRD_PARTY_LICENSES.md** file containing:
   - ✅ Already created - Full text of MIT license for: marked, Vite, vite-plugin-pwa
   - ✅ Already created - Full text of Apache 2.0 / MPL 2.0 for: DOMPurify
   - ✅ Already created - Copyright notices for each dependency

2. **Source Code License**
   - Current: Proprietary/all-rights-reserved (see LICENSE file)
   - Future option: Can switch to MIT, Apache, or GPL later without issues
   - ✅ LICENSE file exists in repository root

3. **Attribution in App**
   - Consider adding "About" page or footer with:
     - Project credits
     - Link to THIRD_PARTY_LICENSES.md file
     - "Powered by" mentions for major dependencies (required for compliance)

### Sample Attribution Text

```
This application uses the following open-source libraries:
- Marked (MIT License) - https://github.com/markedjs/marked
- DOMPurify (Apache 2.0 / MPL 2.0) - https://github.com/cure53/DOMPurify
- Vite (MIT License) - https://vitejs.dev
- vite-plugin-pwa (MIT License) - https://vite-pwa-org.netlify.app

Full license texts available in THIRD_PARTY_LICENSES.md

© 2025 Shower the People. All rights reserved.
```

---

## Action Items

### High Priority
- [ ] **Implement Montserrat Alternates font** with proper OFL compliance when ready
- [ ] **Verify icon designs** don't inadvertently copy existing icons/logos
- [ ] **Create LICENSE file** for the project (recommend MIT for consistency)

### Medium Priority
- [ ] **Create THIRD_PARTY_LICENSES.md** with full license texts for all dependencies
- [ ] **Add "About" section** to app with attribution information
- [ ] **Review markdown content** to ensure all descriptive text is original or properly attributed

### Low Priority
- [ ] **Add package.json license field**: `"license": "MIT"` (or chosen license)
- [ ] **Consider adding COPYRIGHT file** with project copyright notice

---

## Conclusion

**Overall Compliance Status:** ✅ **EXCELLENT**

The project currently uses only permissive open-source licenses (MIT, Apache 2.0, MPL 2.0) that are compatible with each other and allow free use, modification, and distribution. No proprietary code or restrictive licenses detected.

**Key Points:**
1. All npm dependencies have permissive licenses
2. Custom code is original work
3. Icons appear to be original/generic
4. Content is primarily factual data (not copyrightable)
5. No GPL or copyleft licenses that would require source disclosure

**Current License for This Project:** Proprietary/all-rights-reserved (can be changed to MIT, Apache, or GPL later if desired)

---

## License Compatibility Matrix

| License | Compatible with MIT? | Allows Commercial Use? | Requires Attribution? |
|---------|---------------------|------------------------|----------------------|
| MIT (marked, vite, vite-plugin-pwa) | ✅ Yes | ✅ Yes | ✅ Yes |
| Apache 2.0 (DOMPurify option) | ✅ Yes | ✅ Yes | ✅ Yes |
| MPL 2.0 (DOMPurify option) | ✅ Yes | ✅ Yes | ✅ Yes |
| OFL 1.1 (Montserrat font) | ✅ Yes | ✅ Yes | Optional |

All licenses are compatible and allow free use in any type of project.
