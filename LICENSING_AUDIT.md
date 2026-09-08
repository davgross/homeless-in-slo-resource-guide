# Licensing Audit - SLO Homeless Resource Guide

This document provides a comprehensive audit of all third-party assets, libraries, and code used in this project to ensure compliance with copyright and licensing requirements.

**Audit Date:** September 7, 2026 (revised after self-hosting, same day)

**Previous Audit:** October 31, 2025

**Audited By:** Claude (Opus 5)

---

## Summary

✅ **COMPLIANT** — All dependencies use permissive open-source licenses compatible with this project's proprietary licensing.

The October 2025 audit covered only the four `web-app` dependencies that existed at that time.
This revision covers **every** dependency in all four `package.json` files, plus the third-party code and data loaded at runtime from CDNs, which the earlier audit did not address at all.

### What changed since the last audit

| Change | Detail |
|---|---|
| **6 dependencies were missing entirely** | `qr-creator`, `sharp`, `html-validate`, plus the root project's `xml2js` and `remark-*` tooling |
| **2 runtime CDN dependencies were undocumented** | Leaflet and the OpenDyslexic font are loaded from CDNs at runtime and appeared in no audit |
| **OpenStreetMap was undocumented** | Map tiles and data carry a *required* attribution under ODbL |
| **1 dependency added** | `puppeteer-core` (Apache-2.0), added September 2026 for the accessibility test suite |
| **Stale action items resolved** | `LICENSE` and `THIRD_PARTY_LICENSES.md` both now exist; Montserrat Alternates is now actually implemented |
| **Versions drifted** | DOMPurify 3.3.0 → 3.4.14, Vite 6.4.1 → 6.4.3, marked → 14.1.4 |

---

## Runtime Dependencies (ship to users)

These are bundled into the app or loaded by the user's browser. Their attribution obligations are the ones that matter most.

| Library | Version | License | Purpose |
|---|---|---|---|
| [marked](https://github.com/markedjs/marked) | 14.1.4 | MIT | Markdown → HTML parsing |
| [DOMPurify](https://github.com/cure53/DOMPurify) | 3.4.14 | Apache-2.0 OR MPL-2.0 | HTML sanitization (XSS prevention) |
| [qr-creator](https://github.com/nimiq/qr-creator) | 1.0.0 | MIT | QR codes in the share dialog |
| [Leaflet](https://leafletjs.com/) | 1.9.4 | BSD-2-Clause | Interactive maps (self-hosted) |
| [mimetext](https://github.com/muratgozel/MIMEText) | 3.0.27 | MIT | Email construction in the Cloudflare Worker |

**Copyright holders:**

- marked — MarkedJS (2018+), Christopher Jeffrey (2011–2018)
- DOMPurify — Dr.-Ing. Mario Heiderich, Cure53
- qr-creator — The Nimiq Foundation (2017)
- Leaflet — Volodymyr Agafonkin (2010–2023), CloudMade (2010–2011)

**Compliance:** ✅ All permissive. Full texts in `THIRD_PARTY_LICENSES.md`.

### Note on Leaflet: now self-hosted

Leaflet was previously loaded at runtime from `unpkg.com`. It is now vendored into `web-app/public/vendor/leaflet/` (issues #419 and #420), so the maps work offline and survive CDN filtering on public Wi-Fi.

**This changes the obligation.** Under BSD-2-Clause the copyright notice must be reproduced in **redistributions**, and serving the library from our own origin *is* redistribution. Linking to a CDN arguably was not.

**Compliance:** ✅ `web-app/public/vendor/leaflet/LICENSE` ships alongside `leaflet.js`, carrying the full BSD-2-Clause text and both copyright lines. The text is also in `THIRD_PARTY_LICENSES.md`.

---

## Build and Development Dependencies (do not ship)

These never reach users, so attribution obligations are minimal. Documented for completeness.

| Package | Version | License | Where | Purpose |
|---|---|---|---|---|
| [Vite](https://vitejs.dev) | 6.4.3 | MIT | `web-app` | Build tool and dev server |
| [vite-plugin-pwa](https://vite-pwa-org.netlify.app) | 0.21.2 | MIT | `web-app` | Service worker and manifest generation |
| [html-validate](https://html-validate.org/) | 10.4.0 | MIT | `web-app` | HTML validation in CI |
| [sharp](https://github.com/lovell/sharp) | 0.34.5 | Apache-2.0 | `web-app` | Maskable icon generation |
| [puppeteer-core](https://pptr.dev/) | 24.43.1 | Apache-2.0 | `web-app` | Headless browser for `npm run test:a11y` |
| [xml2js](https://github.com/Leonidas-from-XIV/node-xml2js) | 0.6.2 | MIT | root | Parsing in content tooling |
| [remark-cli](https://github.com/remarkjs/remark) | 12.0.1 | MIT | root | Markdown linting |
| remark-frontmatter | 5.0.0 | MIT | root | Markdown linting |
| remark-gfm | 4.0.1 | MIT | root | Markdown linting |
| unist-util-visit | 5.0.0 | MIT | root | Custom remark style rules |
| unist-util-visit-parents | 6.0.2 | MIT | root | Custom remark style rules |

**Compliance:** ✅ All permissive.

**Note on `vite-plugin-pwa`:** although a build-time plugin, it *generates* service worker code (via Workbox, MIT) that ships to users. Workbox's licence is permissive and its notice travels in the generated file.

**Note on `puppeteer-core`:** deliberately `puppeteer-core` rather than `puppeteer`, so no Chromium binary is downloaded. It drives the developer's existing Chrome install. Chromium itself is therefore not redistributed by this project and carries no obligation here.

---

## Third-Party Data and Services

### OpenStreetMap

Map imagery and map data. **This carries the project's only mandatory runtime attribution.**

- **Map data:** © OpenStreetMap contributors, [ODbL 1.0](https://opendatacommons.org/licenses/odbl/)
- **Map tiles:** OpenStreetMap Foundation, [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/)
- **Requirement:** "© OpenStreetMap contributors" must be displayed with any produced work
- **Compliance:** ✅ Each map page passes `attribution: '© OpenStreetMap contributors'` to its Leaflet tile layer, rendering the notice in the map's attribution control
- **Also:** every address link in the guide falls back to `openstreetmap.org`; these are ordinary outbound links and need no attribution

⚠️ **Tile usage policy:** tiles are fetched directly from `tile.openstreetmap.org`, which is subject to the [OSMF Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/).
Current volume is well within limits for a small community project. Significant growth would require a commercial tile provider or self-hosted tiles.

### Google Maps / Apple Maps

- **Usage:** address links deep-link into the user's preferred map app
- **Compliance:** ✅ No API keys, no embedded content, only deep links — permitted under their terms

### Cloudflare Pages / Workers

- **Usage:** hosting and the feedback email Worker
- **Compliance:** ✅ Service usage under Cloudflare's terms; no code redistribution

---

## Fonts

Both fonts are **self-hosted** as of September 2026 (issue #420). They were previously fetched from third-party CDNs at runtime, which meant neither survived going offline — and OpenDyslexic, an accessibility feature, failed *silently*: the toggle reported success while the text never changed.

**This changes the obligation.** OFL 1.1 requires that the copyright notice and licence text accompany the font files wherever the fonts are **redistributed**. Serving them from our own origin is redistribution.

**Compliance:** ✅ `web-app/public/fonts/` contains `OpenDyslexic-OFL.txt`, `MontserratAlternates-OFL.txt`, and a `README.txt` recording provenance and the modifications made.

### OpenDyslexic

- **License:** SIL Open Font License 1.1
- **Copyright:** Abbie Gonzalez, with Reserved Font Name OpenDyslexic
- **Source:** [opendyslexic.org](https://opendyslexic.org/) — official release v0.91.12, *not* the third-party CDN redistributor used previously
- **Usage:** optional dyslexia-friendly font, user-selectable in the text-size popup
- **Modification:** subset to Latin + Latin-Extended with `pyftsubset` and converted to woff2 — 135 KB for all four faces, down from 464 KB. No glyph outlines altered.
- **Reserved Font Name:** OFL reserves the name "OpenDyslexic". We redistribute the font unmodified in substance (subsetting only) and keep the original name, which the licence permits for unmodified fonts. **If glyphs are ever edited, the font must be renamed.**

### Montserrat Alternates

- **License:** SIL Open Font License 1.1
- **Copyright:** The Montserrat Project Authors
- **Source:** Google Fonts, weight 700, latin and latin-ext subsets
- **Usage:** brand/display font for navigation and headings

## Source Code

### Custom Code (Fully Original)

All application code is original work created for this project.

**`web-app/src/`** — `main.js`, `style.css`, `markdownParser.js`, `linkEnhancer.js`, `feedback.js`, `shareButton.js`, `installPrompt.js`, `fontSizeControl.js`, `strings.js`, `i18nInit.js`, `languageSwitcher.js`, `modal.js`, `motion.js`

**`web-app/public/`** — `map-feedback.js`, `map-i18n.js`, the three `*-map.html` pages

**`web-app/scripts/`** — `extract-map-data.js`, `validate-html.js`, `a11y-smoke.mjs`

**`web-app/`** — `index.html`, `vite.config.js`, `vite-plugin-minify-markdown.js`, `vite-plugin-print-map-helper-url.js`, `create-maskable-icons.js`, `map-data-helper.html`

**`web-app/functions/`** — the feedback API endpoint and email Worker

**Root** — `validate-markdown.js`, `remark-style-guide.js`, `spell-check.cjs`, `scripts/`

Generated files (`web-app/public/*-data*.js`) are produced by `extract-map-data.js` from this project's own markdown content.

**License Status:** ✅ No third-party code copied or adapted.
Inline SVG icons (the search magnifier, install arrow, close crosses) are original.

**Ownership:** Proprietary — © 2025 Shower the People, all rights reserved (see `LICENSE`).

**Note:** proprietary licensing remains fully compatible with every dependency above; none is copyleft with respect to this project's own source.

---

## Assets

### Icons and Images

`favicon.ico`, `icon-192.png`, `icon-512.png`, `icon-192-maskable.png`, `icon-512-maskable.png`, `apple-touch-icon.png`

- Custom-created for this project — ✅ original work
- Maskable variants generated by `create-maskable-icons.js` from the originals

⚠️ **Open item:** verify the logo design does not inadvertently resemble an existing mark. Carried over from the previous audit; still unverified.

### Emoji

The UI uses Unicode emoji (🔗 📖 💬 💧 🚌 …) as icons in the floating buttons and Index lozenges.

- **Status:** ✅ No licensing concern. Unicode code points are not copyrightable, and glyphs are rendered by the user's own operating system font — this project ships no emoji artwork.

### Poison Oak Images

| File | License | Attribution required |
|---|---|---|
| `poison-oak-1.png` | CC BY 2.0 — r.mcminds | Yes |
| `poison-oak-2.png` | CC BY-SA 4.0 — Frank Schulenburg | Yes, plus share-alike |
| `poison-oak-3.png` | CC0 1.0 — Alan Schmierer | No (courtesy only) |

All cropped and resized from originals. Full source URLs and attribution text in `THIRD_PARTY_LICENSES.md`.

⚠️ **Share-alike note:** `poison-oak-2.png` is CC BY-SA 4.0. The share-alike obligation attaches to *that image and derivatives of it*, not to the surrounding application, so it does not affect the project's proprietary licensing. Attribution is currently carried in `THIRD_PARTY_LICENSES.md` rather than adjacent to the image in the guide.

---

## Content

`Resource guide.md`, `Directory.md`, `About.md` and their `_es` translations.

- ✅ Factual data (addresses, phone numbers, hours, eligibility) — not copyrightable
- ⚠️ Descriptive text — must be original, paraphrased, or properly attributed; not copied verbatim from agency websites

`<!-- Source: https://... -->` annotations exist for **verification**, not as copyright attribution. They do not license verbatim reuse of copyrighted text.

**Current status:** content appears to be primarily factual directory information with original descriptive prose.

---

## Action Items

### Resolved since the last audit

- [x] Create `LICENSE` file — exists (proprietary/all-rights-reserved)
- [x] Create `THIRD_PARTY_LICENSES.md` — exists, now covering all runtime dependencies
- [x] Implement Montserrat Alternates with OFL compliance — implemented
- [x] Add attribution section to the app — `About.md` "Open-Source Libraries and Fonts"
- [x] Add `license` field to `package.json` — set to `UNLICENSED`, matching `LICENSE`

### Outstanding

- [ ] **Verify icon designs** do not inadvertently copy an existing logo or mark *(carried over; still unverified)*
- [ ] **Review descriptive text** across the guide for verbatim copying from agency sites
- [x] ~~**Consider self-hosting OpenDyslexic**~~ — done; taken from opendyslexic.org, with the OFL text bundled
- [x] ~~**If Leaflet is self-hosted, ship its BSD-2-Clause notice**~~ — done; `vendor/leaflet/LICENSE`
- [ ] **Re-run this audit whenever a dependency is added** — the previous audit went eleven months while six dependencies accumulated undocumented

---

## Conclusion

**Overall Compliance Status:** ✅ **COMPLIANT**

Every dependency uses a permissive licence (MIT, Apache-2.0, MPL-2.0, BSD-2-Clause, OFL-1.1). None is copyleft with respect to this project's source, so the proprietary licence in `LICENSE` is unaffected.

**Mandatory attributions**, all satisfied:

1. **OpenStreetMap** — "© OpenStreetMap contributors", rendered by the Leaflet attribution control on all three map pages
2. **Leaflet** (BSD-2-Clause, now redistributed) — `web-app/public/vendor/leaflet/LICENSE`
3. **OpenDyslexic and Montserrat Alternates** (OFL 1.1, now redistributed) — the `*-OFL.txt` files in `web-app/public/fonts/`

The last two became requirements rather than courtesies when the assets moved from CDNs to our own origin.

All other attributions are satisfied by `THIRD_PARTY_LICENSES.md` and the list in `About.md` / `About_es.md`.

---

## License Compatibility Matrix

| License | Used by | Compatible with proprietary use? | Commercial use? | Attribution required? |
|---|---|---|---|---|
| MIT | marked, qr-creator, Vite, vite-plugin-pwa, mimetext, html-validate, xml2js, remark-* | ✅ Yes | ✅ Yes | ✅ Yes |
| Apache-2.0 | DOMPurify (option), sharp, puppeteer-core | ✅ Yes | ✅ Yes | ✅ Yes |
| MPL-2.0 | DOMPurify (option) | ✅ Yes (file-level copyleft only) | ✅ Yes | ✅ Yes |
| BSD-2-Clause | Leaflet | ✅ Yes | ✅ Yes | ✅ **Yes — we now redistribute** |
| OFL-1.1 | Montserrat Alternates, OpenDyslexic | ✅ Yes | ✅ Yes | ✅ **Yes — we now redistribute** |
| ODbL-1.0 | OpenStreetMap data | ✅ Yes | ✅ Yes | ✅ **Yes — required** |
| CC BY 2.0 / CC BY-SA 4.0 / CC0 | Poison oak images | ✅ Yes | ✅ Yes | Yes / Yes / No |

No licence above requires this project to disclose its own source.
