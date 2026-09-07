# Accessibility Audit Report

## VivaSLO — SLO County Homeless Resource Guide Web App

**Date:** September 7, 2026
**Auditor:** Claude (Opus 5)
**Status:** Findings 1–15, 17–22 and 24 fixed the same day (branch `accessibility-audit-fixes`); see *Remediation log* at the end
**Standards:** WCAG 2.1 / 2.2 Level AA, weighted toward the guide's target audience
**Previous audits:** October 31, 2025; December 3–4, 2025

---

## Executive summary

The December 2025 audit concluded the app was "fully compliant with WCAG 2.1 Level AA."
That conclusion does not hold up.

The earlier audit verified that ARIA *attributes were present*.
It did not verify that the widgets those attributes describe actually work, and it did not test the code paths where accessibility features are silently overwritten at runtime.
Several of the items marked ✅ FIXED are, on inspection, incomplete or inert.

This audit found **7 Level A/AA failures**, plus a set of issues that are not numbered WCAG violations but are real barriers for this guide's specific readers — people with cognitive disabilities, low vision, low literacy, low digital literacy, Spanish as a first language, and cheap Android phones.

**Overall assessment:** Not compliant. The core content is in good shape; the *interactive shell* around it (search, modals, floating controls, maps) is where the failures cluster.

### Failures at a glance

| # | Issue | WCAG | Level | Status |
|---|---|---|---|---|
| 1 | Search results cannot be operated by keyboard at all | 2.1.1 Keyboard | **A** | Fixed |
| 2 | Focus indicator removed from 5 controls | 2.4.7 Focus Visible | **AA** | Fixed |
| 3 | Focus outline color fails contrast, worst on the header | 1.4.11 Non-text Contrast | **AA** | Fixed |
| 4 | Modals are not dialogs; focus is never restored | 4.1.2 Name, Role, Value | **A** | Fixed |
| 5 | External-link color fails contrast on 2 of 3 backgrounds | 1.4.3 Contrast | **AA** | Fixed |
| 6 | Map pages have no text alternative to the map | 1.1.1 Non-text Content | **A** | Fixed |
| 7 | Spanish pages announce English ARIA labels throughout | 3.1.2 Language of Parts | **AA** | Fixed |

---

## Level A / AA failures

### 1. Search results are completely inoperable by keyboard — WCAG 2.1.1 (Level A)

This is the most serious finding.
Search is the app's primary "find things fast" affordance, and it works only with a mouse or a tap.

`displaySearchResults()` (`web-app/src/main.js:1214`) builds each result as:

```html
<div class="search-result-item" role="option" data-result-type="…" data-result-id="…">
```

- No `tabindex`, so no result can ever receive focus.
- No `keydown` handler anywhere in `setupSearch()` — no `↓`/`↑`, no `Enter`, no `Esc`.
- The only handler attached is `item.addEventListener('click', …)` (`main.js:1256`).

A keyboard-only user, or a screen-reader user on a phone, can type a query, hear "12 results found," and then has no way to reach any of them.

The surrounding ARIA is also structurally invalid, which means the results are misreported even to users who *can* click:

- `#search-input` carries `aria-expanded`, `aria-controls`, and `aria-autocomplete` (`web-app/index.html:32`) but **has no `role="combobox"`**. Those attributes are not supported on the implicit `searchbox` role, so assistive technology ignores them.
- `role="listbox"` contains a `.search-results-header` div and a `.search-no-results` div, which are not `option` elements. A listbox may only contain options (and groups).
- The `role="option"` items have no `aria-selected`.
- There is no `aria-activedescendant` wiring, which is how a combobox tells AT which option is current.

**Fix:** implement the [ARIA APG combobox-with-listbox pattern](https://www.w3.org/WAI/ARIA/APG/patterns/combobox/) properly — `role="combobox"` on the input, `aria-activedescendant` pointing at the highlighted option, arrow-key/Enter/Escape handling, `aria-selected` on options, and move the "N results found" header and the no-results message *outside* the listbox element.

> Note: `web-app/.htmlvalidate.json` excludes `listbox` from the `prefer-native-element` rule. The linter flagged this pattern and it was suppressed rather than fixed.

### 2. Focus indicator removed from five controls — WCAG 2.4.7 (Level AA)

Five rules set `outline: none` on `:focus` with **no replacement indicator** (no box-shadow, no border change, no background change):

| File / line | Control |
|---|---|
| `web-app/src/style.css:805` | Directory modal close button (✕) |
| `web-app/src/style.css:840` | Directory modal feedback button (💬) |
| `web-app/src/style.css:867` | Directory modal share button (🔗) |
| `web-app/src/style.css:2038` | Feedback modal close button (✕) |
| `web-app/src/style.css:2091` | Feedback form inputs, select, textarea |

Only the last one is partially mitigated: it swaps in `border-color: var(--secondary-color)`, a `#e0e0e0` → `#5a93ff` change measuring **2.26:1** — below the 3:1 that WCAG 2.2's 1.4.11 requires for a focus indicator against its unfocused state.

This is made worse by issue 4: `trapFocus()` moves focus to the *first* focusable element when the directory modal opens, which is the 💬 feedback button — a control with **zero** visible focus indicator. A keyboard user opens a directory entry and their focus vanishes.

**Fix:** delete all five `outline: none` declarations. If the default outline is visually unwanted on round buttons, replace it with `box-shadow: 0 0 0 3px <colour>` rather than removing it.

### 3. Focus outline color fails non-text contrast — WCAG 1.4.11 (Level AA)

The global focus indicator (`style.css:55–59`) is `outline: 3px solid var(--secondary-color)`, i.e. `#5a93ff`. Measured:

| Focus outline against | Ratio | Needs | Result |
|---|---|---|---|
| `#ffffff` page background | **2.98:1** | 3:1 | ✗ Fail (marginal) |
| `#1a62ff` header background | **1.67:1** | 3:1 | ✗ **Fail (badly)** |

The header is where the nav buttons (Resources / Directory / About) and the search input live.
Those are the first four controls a keyboard user reaches, and the focus ring is very nearly invisible on them.

**Fix:** use a focus color that works on both grounds, or set a header-specific override. White (`#ffffff`) gives 5.33:1 on the header blue; a dark navy such as `#0b2a6b` gives good contrast on white. A common robust solution is a two-tone outline: `outline: 3px solid #ffffff; box-shadow: 0 0 0 6px #0b2a6b;`.

### 4. Modals are not announced as dialogs, and focus is never restored — WCAG 4.1.2 (Level A)

Three modal-like surfaces exist. None is fully correct:

| Modal | `role="dialog"` | `aria-modal` | Labelled | Focus moved in | Focus trapped | Focus restored | Background inert |
|---|---|---|---|---|---|---|---|
| Directory entry (`index.html:51`) | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ | ✗ |
| Feedback (`feedback.js:33`) | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| QR code (`shareButton.js:217`) | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |

Consequences:

- **Nothing is announced as a dialog.** Screen-reader users get no "dialog" boundary and no indication that the page behind is out of play.
- **Nothing is inert.** With a modal open, a screen reader's virtual cursor and (for the feedback and QR modals) the `Tab` key both walk straight out into the 450 KB guide behind the overlay. The user has no idea they have left the dialog.
- **Focus is never restored.** `hideDirectoryOverlay()` (`main.js:868`) just sets `overlay.hidden = true`. Focus lands on `<body>`, and the next `Tab` starts over from the top of the page. A user who opened the 200th directory link from deep in the guide is returned to the top and must find their place again. This was listed as unverified in the December audit's own checklist (`[ ] Focus returns to trigger after closing modals`) and never done.
- **`trapFocus()` leaks handlers.** `main.js:877` attaches a fresh `keydown` listener to the overlay on every open, and never removes it. After 20 directory entries there are 20 live handlers competing.
- **`trapFocus()` focuses the wrong thing.** It focuses the first focusable element (the 💬 button). It should focus the modal container (`tabindex="-1"`) or the entry heading, so the user hears which organization they just opened.

**Fix:** add `role="dialog" aria-modal="true"` and an `aria-labelledby` pointing at the entry title to all three; store `document.activeElement` on open and restore it on close; set `inert` on `#app` (or `aria-hidden` plus focus containment) while a modal is open; register the trap handler once and remove it on close.

### 5. External-link color fails contrast on two of three section backgrounds — WCAG 1.4.3 (Level AA)

The December audit tested `--external-link-color: #c65010` against white only (`4.61:1`, pass) and declared it fixed.
The app renders sections on three different backgrounds (`style.css:277–286`):

| External link `#c65010` on | Ratio | Result |
|---|---|---|
| `#ffffff` — Resources | 4.61:1 | ✓ Pass |
| `#fffbeb` — Directory (pale yellow) | **4.44:1** | ✗ Fail |
| `#f0f9ff` — About (pale blue) | **4.32:1** | ✗ Fail |

The Directory is the section most densely packed with external links, so this is where it matters most.

Also failing, from the same family of "tested on white only" checks:

| Pair | Ratio | Result |
|---|---|---|
| Error text `#dc2626` on its own error background `#fef2f2` | **4.41:1** | ✗ Fail |
| Modal button amber borders `#fbbf24` on `#ffffff` (UI component, 3:1) | **1.67:1** | ✗ Fail |
| White text on the `#5a93ff` feedback FAB (UI component, 3:1) | **2.98:1** | ✗ Fail |

Darkening `--external-link-color` to roughly `#b8480c` clears 4.5:1 on all three backgrounds. Darkening the error red to `#b91c1c` clears its own background.

The passing values are also slightly lower than the December audit claimed (e.g. links on white measure 4.96:1, not 5.33:1). They still pass, but the margin is thinner than recorded — worth knowing before anyone lightens a background.

### 6. Map pages give no text alternative to the map — WCAG 1.1.1 (Level A)

`web-app/public/naloxone-locations-map.html`, `little-free-libraries-map.html`, and `little-free-pantries-map.html` render a Leaflet map and nothing else.
The location data is right there in the page as a JS array (`naloxone-locations-data.js`), but it is only ever used to place markers.

A blind user, a keyboard user, a user whose phone blocks the `unpkg.com` CDN, or a user on a connection too slow to fetch map tiles gets a single line of text: *"23 locations county-wide • Click markers for details."*
That line is also mouse-only in its wording.

This is a high-impact, low-effort fix: render the same `locations` array as a plain `<ul>` beneath the map, each item giving the label plus a map link. It helps screen-reader users, keyboard users, low-bandwidth users, and anyone who would rather read a list than pinch-zoom a map — a large share of this audience.

Two further problems on these pages:

- **`lang="en"` and English-only.** There is no Spanish version, and the Spanish guide links to them. A Spanish-speaking user is dropped onto an English page with no way back to Spanish.
- **Geolocation is requested on page load** (`naloxone-locations-map.html:295`). The code comment says "without prompting," but Chrome and Firefox *do* prompt. A permission dialog asking for the physical location of someone looking up naloxone sites is, for this audience, alarming and a reason to close the page. It should be behind an explicit "Show my location" button.

### 7. Spanish pages announce English ARIA labels throughout — WCAG 3.1.2 (Level AA)

When the app runs in Spanish, `initI18n()` correctly sets `document.documentElement.lang = 'es'`.
But ten ARIA labels are hardcoded English string literals that are applied *after* i18n, and they override it:

| File / line | Hardcoded label | Applied to |
|---|---|---|
| `linkEnhancer.js:26`, `:72` | `Call ${number}` | **Every phone number in the guide** |
| `linkEnhancer.js:98` | `Email ${address}` | Every email address |
| `linkEnhancer.js:118` | `${text} (opens in new tab)` | Every external link |
| `markdownParser.js:207` | `View directory entry for ${name}` | Every directory cross-reference |
| `main.js:225–231` | `Index (currently visible)`, `Jump up to index`, … | Index button, **re-set on every scroll event** |
| `main.js:550` | `Index` | The lozenge grid landmark |

Because `aria-label` *replaces* the accessible name, a Spanish screen-reader user does not hear the phone number — they hear a Spanish TTS voice attempting to pronounce the English word "Call," then the digits. Every phone number, every email, every external link, every directory link.

The `main.js:225–231` case also actively fights the i18n layer: `updateTOCButtonState()` runs on every scroll and overwrites the Spanish label `i18nInit.js:145` just set.

This defeats the purpose of having a Spanish translation for exactly the users who most need it.

**Fix:** move all ten strings into `strings.js` and read them through `getStrings()`.

---

## Serious barriers that are not numbered WCAG failures

### 8. Every accessibility control is at the very end of the tab order

Six floating buttons are appended to `<body>` after `#app`: share (🔗), index (📖), font size (A), install, language (EN/ES), and feedback (💬).

Tab order is therefore: skip link → header → nav → search → **the entire Resource Guide** → floating buttons.

The Resource Guide is a 450 KB document with several thousand links.
To reach the font-size control or the language switcher by keyboard, a user must tab past all of them.

The irony is sharp: the two controls a low-vision or Spanish-speaking user needs *first* — text size and language — are the hardest two to reach.

**Fix:** give the floating-button cluster a `tabindex`-ordered position near the top, or (cleaner) move it into the DOM immediately after the header inside a `<div role="toolbar" aria-label="…">` and position it with CSS. A keyboard shortcut or a second skip link ("Skip to display settings") would also work.

### 9. The app overrides the user's browser font-size setting

`style.css:28` and `:37`:

```css
:root { --font-size-base: 16px; }
html  { font-size: var(--font-size-base); }
```

A low-vision user who has set their browser's default text size to 24px gets 16px anyway, because the app hardcodes an absolute value on `html`.
`fontSizeControl.js:300` compounds this: it computes `16 * (percentage/100)`, so even "150%" is 24px absolute rather than 150% of whatever the user chose.

This is the classic 1.4.4 Resize Text anti-pattern, and it affects precisely the users most likely to have changed that setting.

**Fix:** `html { font-size: 100%; }` and express the scale as a unitless multiplier — `document.documentElement.style.fontSize = percentage + '%'`. The in-app control then *multiplies* the user's preference instead of replacing it. (This also removes the oddity at `style.css:892` where the ≥768px breakpoint's `--font-size-base: 18px` is silently discarded as soon as the user touches the font-size control, because the JS writes an inline style that outranks the media query.)

### 10. Smooth scrolling ignores `prefers-reduced-motion`

The CSS respects the preference (`style.css:1399`), but four JavaScript calls hardcode `behavior: 'smooth'` and are unaffected by CSS media queries:

`main.js:240`, `main.js:1305`, `main.js:1309`, and the mobile-keyboard handler in `feedback.js:199`.

Jumping to a section from the Index smooth-scrolls through hundreds of screens of content. For a user with a vestibular disorder that is genuinely nauseating.

**Fix:** `const smooth = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';`

### 11. The high-contrast block is dead code, and forced-colors is unsupported

`style.css:1381` uses `@media (prefers-contrast: high)`.
The value in Media Queries Level 5 is **`more`**, not `high`. `high` was an early Safari-only spelling. In current Chrome, Firefox, and Safari this block never matches, so the high-contrast support that the December audit credited does not run.

There is also no `@media (forced-colors: active)` block, so Windows High Contrast Mode is untested territory — a concern given the many CSS-drawn borders and emoji-with-text-shadow buttons.

**Fix:** `@media (prefers-contrast: more), (prefers-contrast: high)` for coverage, and add a `forced-colors` block that at minimum removes the emoji `text-shadow` glows and gives the FABs `border: 1px solid ButtonText`.

### 12. Every external link is forced into a new tab

`linkEnhancer.js:112` sets `target="_blank"` on all external links.

For a user with a cognitive disability, or someone borrowing a library computer, or someone on a phone browser where tab management is opaque, an unexpected new tab means the back button no longer works and they cannot find their way back to the guide.
The `(opens in new tab)` label mitigates this only for screen-reader users, and only in English (see issue 7).

**Fix:** let external links open in the same tab. The guide is a PWA with reliable back-button behavior; that is a friendlier model for this audience than tab proliferation. If new tabs are wanted for some links, make it opt-in per link in the markdown rather than blanket.

### 13. The search field has no visible label

`index.html:32` supplies `placeholder="Search…"` plus an `aria-label`.
The placeholder is the only visible affordance, and it disappears the moment the user types a character.

For users with cognitive disabilities or low literacy, a field whose label vanishes on first keystroke is a known problem — and the guidance (WCAG 3.3.2) is explicit that placeholder text is not a label.

**Fix:** a persistent visible `<label>` above the field, or a visible magnifier icon plus label text. There is room in the header.

---

## Smaller issues

| # | Issue | Location |
|---|---|---|
| 14 | **Four CSS variables are used but never defined** — `--bg-secondary`, `--text-primary`, `--text-secondary`, `--font-size-h`. The A−/Default/A+ buttons in the font-size popup therefore render with a transparent background and inherited color, losing their button affordance. | `style.css:1634, 1649, 1650, 1674, 1700` |
| 15 | **The font-size popup covers the language button.** The popup sits at `bottom: 140px; left: 20px` — the exact coordinates of `#language-btn`. Opening one hides the other. | `style.css` (`.font-size-popup` vs `#language-btn`) |
| 16 | **Popup triggers lack `aria-expanded` / `aria-haspopup`.** The font-size and language buttons toggle popups but never announce open/closed state, and focus is not moved into the popup on open. | `fontSizeControl.js:195`, `languageSwitcher.js:452` |
| 17 | **"Last updated" always shows today's date.** `updateLastModifiedDate()` prints `new Date()`, so the guide claims to have been updated the moment you loaded it. It also hardcodes the `'en-US'` locale, giving Spanish users an English date. This is an accuracy problem, not just an i18n one. | `main.js:1390` |
| 18 | **Unescaped search query written to `innerHTML`.** `showNoResults()` interpolates the raw query into markup. Self-XSS only (the query cannot be set from the URL), but it will also break rendering on any query containing `<`. | `main.js:1330` |
| 19 | **Directory cross-references are `href="#"` links, not buttons.** They open a modal, so `role="button"` (or a real `<button>`) is the correct semantics. As written, Ctrl-click/middle-click does nothing useful, and if JS fails the link jumps the user to the top of the page. | `markdownParser.js:206` |
| 20 | **`setInterval(…, 500)` polls forever** to detect section changes for the Index button. On a low-end Android phone this is avoidable battery and jank. Use the existing `showSection()` call site instead. | `main.js:273` |
| 21 | **No dark mode.** No `prefers-color-scheme` block and no `color-scheme` declaration. A bright white full-screen page is a poor experience for someone reading in a vehicle at night, and for users with photophobia or migraine — both common in this population. | `style.css` |
| 22 | **`theme-color` is stale.** Still `#3877ff`, the pre-December blue, in both `index.html:7` and `vite.config.js:46`. Cosmetic, but it means the PWA's system chrome does not match the app. | `index.html:7`, `vite.config.js:46` |
| 23 | ~~**PWA manifest has no `lang`.**~~ **Correction:** it does (`lang: 'en-US'`). Only `dir` was missing; added. | `vite.config.js` |
| 24 | **The `announcer` region does not re-announce identical messages.** Setting the same `textContent` twice is a no-op for live regions. Searching twice for the same term announces the count once. Clear the node first, or append a zero-width variation. | `main.js:273` |

---

## What is genuinely good

Worth stating plainly, because a lot of this is well built:

- **Content semantics are sound.** One `<h1>`, orderly heading levels, real `<table>` markup with `<thead>`, all three images have descriptive alt text.
- **The skip link works** and targets a real `<main id="main-content">`.
- **The Index lozenge grid is well done** — real links, decorative icons correctly `aria-hidden`, generous 100px targets, and a labelled navigation landmark.
- **Touch targets are comfortable.** All floating buttons are 50×50px, above the 44px guideline.
- **Body text contrast is excellent** (12.63:1) and `line-height: 1.7` is a genuinely good choice for low-literacy readers.
- **OpenDyslexic support** is a thoughtful, lazily-loaded addition aimed squarely at this audience.
- **Print styles are thorough** — interactive chrome is hidden, links are expanded.
- **Form validation ARIA is correct** — `aria-invalid`, `aria-describedby`, `role="alert"`, and focus moved to the first invalid field. This one really was fixed in December.
- **HTML is sanitized** with DOMPurify on every render path.

---

## Recommended order of work

### Phase 1 — the things that lock people out (est. 1–2 days)

1. Make search results keyboard-operable and fix the combobox ARIA (issue 1)
2. Remove the five `outline: none` rules (issue 2)
3. Fix the focus-outline color, especially on the header (issue 3)
4. Add `role="dialog"`, focus restoration, and `inert` backgrounds to all three modals (issue 4)

### Phase 2 — contrast and language (est. half a day)

1. Darken `--external-link-color` and the error red; re-verify against all three section backgrounds (issue 5)
2. Move the ten hardcoded English ARIA labels into `strings.js` (issue 7)

### Phase 3 — the audience-specific wins (est. 1–2 days)

1. Add a text list of locations to each map page; gate geolocation behind a button; produce Spanish map pages (issue 6)
2. Move the floating controls up the tab order (issue 8)
3. Switch to `font-size: 100%` and a multiplicative text scale (issue 9)
4. Respect `prefers-reduced-motion` in the four JS scroll calls (issue 10)
5. Give the search field a visible label (issue 13)
6. Stop forcing `target="_blank"` (issue 12)

### Phase 4 — cleanup

Issues 11 and 14–24.

---

## Testing still needed

Everything above comes from code inspection and computed contrast ratios.
These require a browser and could not be verified here:

- **Screen-reader passes** — TalkBack on Android is the highest-value target for this audience, then NVDA on Windows. VoiceOver/iOS third.
- **Zoom to 200% and 400%** (WCAG 1.4.4 and 1.4.10 Reflow) at a 320px viewport. The six fixed 50px buttons plus the sticky header are the likely trouble spots.
- **Windows High Contrast Mode** (`forced-colors: active`).
- **An automated axe-core pass** on the built app. Nothing of the kind is installed; `npx @axe-core/cli` against a `vite preview` server would cover the mechanical checks and catch anything this manual review missed.
- **Real-device testing on a low-end Android phone**, which is what most of this audience actually holds.

---

## Method

- Line-by-line review of `web-app/index.html`, `main.js`, `style.css`, `linkEnhancer.js`, `fontSizeControl.js`, `languageSwitcher.js`, `installPrompt.js`, `feedback.js`, `shareButton.js`, `markdownParser.js`, `i18nInit.js`
- Review of the three standalone Leaflet map pages in `web-app/public/`
- Contrast ratios computed directly from the WCAG 2.x relative-luminance formula against the actual declared background colors, not against white by default
- Checked against WCAG 2.1 and 2.2 Level AA, the ARIA Authoring Practices Guide, and the guide's own stated audience profile in `CLAUDE.md`

---

## Remediation log — September 7, 2026

All Level A/AA failures and all but one of the smaller issues were fixed on branch `accessibility-audit-fixes`.

### Fixed

| # | Issue | How |
|---|---|---|
| 1 | Search keyboard operation | Full ARIA combobox: `role="combobox"` on the input, a real `<ul role="listbox">` containing only `role="option"` items, `aria-activedescendant`, `aria-selected`, and ↓/↑/Home/End/Enter/Esc/Tab handling. The result count moved outside the listbox. |
| 2 | Focus indicators | All five `outline: none` rules replaced with a real indicator. |
| 3 | Focus outline contrast | New two-tone ring: white inner + `#0b2a6b` outer, so one half always clears 3:1 (13.48:1 on white, 4.96:1 on the header blue). Moved to `:focus-visible` with a `:focus` fallback. |
| 4 | Modal semantics and focus | New `web-app/src/modal.js` gives all three modals `role="dialog"`, `aria-modal`, `aria-labelledby`, focus moved to the dialog container (so its name is read first), a single non-leaking focus trap, ancestor-walking `inert` on everything outside, and focus restored to the trigger on close. |
| 5 | Contrast | `--external-link-color` / `--brand-orange` → `#b8480c` (min 4.96:1 across all three backgrounds); error red → `#c81e1e` (5.24:1 on its own background); search active-row tint chosen so the blue title stays above 4.5:1. |
| 6 | Map text alternative | All three map pages now render the same `locations` array as a numbered list of map links below the map, and the map gets a descriptive `role="img"` label. Geolocation is now opt-in behind a "Show my location" button instead of prompting on load. |
| 7 | Spanish ARIA labels | All ten hardcoded English strings moved into `strings.js` under `links.*`, `toc.*` and `toolbar.*`. |
| 8 | Tab order | New `#app-toolbar` container sits between the header and `<main>`; the six floating buttons and their popups live in it. Text size is now 9 tabs from page load instead of several thousand. |
| 9 | Font scaling | `--font-size-base: 16px` → `--font-size-scale: 100%`; the control now multiplies the reader's own browser text size instead of replacing it. |
| 10 | Reduced motion | New `web-app/src/motion.js`; all four JS `behavior: 'smooth'` call sites now defer to `prefers-reduced-motion`. CSS also resets `scroll-behavior`. |
| 11 | High contrast | `prefers-contrast: more` (with `high` kept for old Safari), plus a new `forced-colors: active` block for Windows High Contrast Mode. |
| 12 | Forced new tabs | External reading links now open in the same tab, keeping the ↗ indicator via a new `data-external` hook. **Map links deliberately keep `target="_blank"`** — handing off to a maps app should not cost the reader their place — and now announce it. |
| 13 | Search label | Visible `<label>` added; the competing `aria-label` removed so the visible and accessible names match (WCAG 2.5.3). |
| 14 | Undefined CSS variables | `--bg-secondary`, `--text-primary`, `--text-secondary` defined. |
| 15 | Popup overlap | Font-size and language popups repositioned so neither covers a button. |
| 17 | "Last updated" date | Now stamped at build time via `__BUILD_DATE__` and formatted `es-MX` in Spanish, instead of always printing today. |
| 18 | Unescaped search query | Result titles and the no-results message are escaped / set via `textContent`. |
| 19 | Directory links | Given `role="button"` and `aria-haspopup="dialog"`. |
| 20 | Polling | The 500 ms `setInterval` replaced with a `vivaslo:sectionchange` event. |
| 21 | — | *(Dark mode: not done — see below.)* |
| 22 | Stale `theme-color` | `#3877ff` → `#1a62ff` in both `index.html` and the manifest. |
| 24 | Live region | `announce()` clears before setting, so repeat messages are announced. |

### Also found and fixed while testing

- **Service worker was hijacking the map pages.** Workbox's `navigateFallback` served the app shell for any map URL carrying a query string, so `naloxone-locations-map.html?lang=es` returned the guide instead of the map. Fixed with `navigateFallbackDenylist` and `ignoreURLParametersMatching`. This was a latent production bug, not one introduced by these changes.
- **Map feedback form could not be submitted with Enter** — the send button was `type="button"` and the handler listened for `click`. Now a real `submit` handler.
- **Map pages were English-only.** Rather than duplicating three pages, a new `web-app/public/map-i18n.js` translates their chrome from the same `language` preference the app stores.

### Not done

- **Issue 21, dark mode.** This is a design decision as much as an accessibility one — it needs a full second palette and a choice about whether to follow the system or offer a toggle. Worth doing, but it is not a WCAG failure and it is a bigger change than the rest of this batch.

### Verification

A rerunnable headless test now lives at `web-app/scripts/a11y-smoke.mjs` (`npm run test:a11y`). It covers 23 behavioural assertions — keyboard search operation, dialog semantics, focus containment and restoration, inert background, font scaling, and link targeting. All 23 pass. It found two genuine bugs in the first draft of these fixes (a lost variable declaration and a focus trap that leaked because the overlay is nested inside `#app`), which is the argument for keeping it.

Static checks (`npm run validate:all`, `html-validate` on the map pages) also pass, with no new violations on the map pages.

### Follow-up round — same day, from reviewer testing in a real browser

Nine issues found by manual browser review of the fixes above, all now resolved:

| Reported | Cause | Fix |
|---|---|---|
| Redundant visible "Search" label | The visible label duplicated the placeholder | Label is now visually hidden (still names the field); a magnifier icon gives the persistent visual cue the placeholder loses on first keystroke |
| Focus rings on the floating buttons nearly invisible | `#id` rules (specificity 1,0,0) outranked `button:focus-visible` (0,1,1), so only the white half of the ring landed — invisible on white | Added an `#app-toolbar button:focus-visible` rule (1,1,1) that also preserves each button's drop shadow |
| Focus rings faded in | 16 `transition: all` declarations animated the ring itself | Transitions now name only decorative properties; indicators appear instantly |
| Blue sliver over the header | Skip link is 43px tall but was parked at `top: -40px` — pre-existing | Uses `transform: translateY(-100%)`, so it hides fully at any text size |
| Logo focusable but seemingly inert | It is a real control (navigates to Resources) | Left as-is; standard home-link pattern — see note below |
| Slow render, worse on language switch | `getStrings()` re-read `localStorage` per link — **1,712 reads per load** | `getCurrentLanguage()` caches; now 5 reads, and render is **13.5% faster than the pre-audit baseline** |
| Ambiguous map addresses ("1559 10th St.") | The extractor computed the city then discarded it | City is now part of the label ("Grover Beach, 1559 10th St.") |
| Untranslated map list text | Data files were generated only from the English sources | `extract-map-data.js` now emits both languages; pages load the matching dataset. Also fixed a hardcoded English heading regex that made the Spanish naloxone section unmatchable |
| Buttons leaving the screen above 120% text | A table refused to shrink, widening the *layout viewport* past the device width — pre-existing WCAG 1.4.10 Reflow failure | Tables now scroll inside their own container (keyboard-focusable only when they actually scroll) |
| Skip link text invisible (blue on blue) | `a[href]` (0,1,1) outranked the bare `.skip-link` rule (0,1,0), so the link colour won over the white — a 1:1 contrast ratio on its own blue chip. Pre-existing, only visible once the link stopped being clipped | Anchored the colour to `a.skip-link` (all link states) after the link-colour rules; now 4.96:1. A contrast assertion guards it |
| Popups overlapping | Two separate position bugs; the mobile (≤640px) block also left the language button at desktop size and put the font popup directly on top of it | Both breakpoints re-stacked; opening one popup now closes the other |

The regression suite grew to **30 assertions** and caught three of these before they shipped: a function accidentally defined inside another function's scope, the mobile popup overlap (which passes at desktop width and fails at 390px), and the focus-ring specificity.

**A note on the logo:** it is not decorative — it navigates to Resources, the standard "logo goes home" pattern. It is kept in the tab order for that reason. If the duplication with the adjacent *Resources* button is unwanted, `tabindex="-1"` on `.header-logo` removes it from keyboard order while leaving it usable by mouse and screen reader.

**Still requires a human with a browser:** screen-reader passes, 200%/400% zoom, Windows High Contrast Mode, and low-end Android testing. See *Testing still needed* above.
