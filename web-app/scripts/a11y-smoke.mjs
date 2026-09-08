/**
 * Accessibility smoke test
 *
 * Drives the built app in headless Chrome and asserts the behaviours that the
 * September 2026 audit fixed. These are things a static linter cannot see:
 * whether a widget can actually be operated by keyboard, whether focus goes
 * where it should, whether a dialog really contains focus.
 *
 * Usage:
 *   npm run build
 *   npm run preview -- --port 4317   (in another terminal)
 *   npm run test:a11y
 *
 * Requires Chrome at /usr/bin/google-chrome (override with CHROME_PATH) and
 * puppeteer-core. Run against a URL other than the default with A11Y_URL.
 */

import puppeteer from 'puppeteer-core';

const BASE_URL = process.env.A11Y_URL || 'http://localhost:4317/';

// The host the app is served from. Derived rather than hardcoded, so the
// "no third-party requests" checks work when the suite is pointed at a
// preview or production deployment, not just a local preview server.
const OWN_HOST = new URL(BASE_URL).hostname;

// Hosts injected by the hosting platform rather than by our code. Cloudflare
// adds its Web Analytics beacon at the edge, so it appears on the deployed
// site but not on a local preview, and no repo change can remove it. Blocking
// it is harmless; failing the run over it would be noise.
const PLATFORM_HOSTS = ['static.cloudflareinsights.com'];

/** Is this request going somewhere other than the site under test? */
function isThirdParty(url) {
  const u = new URL(url);
  // data: and blob: are inline, not third-party origins
  if (!/^https?:$/.test(u.protocol)) return false;
  if (PLATFORM_HOSTS.includes(u.hostname)) return false;
  return u.hostname !== OWN_HOST;
}
const CHROME = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const results = [];
const pass = (n, d='') => results.push(['PASS', n, d]);
const fail = (n, d='') => results.push(['FAIL', n, d]);

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox','--disable-dev-shm-usage']
});
const page = await browser.newPage();
await page.setViewport({width: 390, height: 844});
// Uncaught exceptions are always a failure: a script that dies part-way
// leaves the page half-initialised, and several assertions below would pass
// anyway. (This is what caught a function accidentally scoped inside another
// function during development.)
const pageErrors = [];

// Console errors are noisier. A blocked or failed *resource* fetch is usually
// the environment, not the app — CI runners block some cross-origin font
// requests, for instance — so those are reported but do not fail the run.
// Anything else logged at error level still fails.
const consoleErrors = [];
const resourceWarnings = [];

const isResourceNoise = (text) =>
  /Failed to load resource|ERR_BLOCKED_BY_RESPONSE|ERR_NAME_NOT_RESOLVED|ERR_INTERNET_DISCONNECTED|net::ERR_/i.test(text);

page.on('pageerror', e => pageErrors.push(e.message));
page.on('console', m => {
  if (m.type() !== 'error') return;
  const text = m.text();
  (isResourceNoise(text) ? resourceWarnings : consoleErrors).push(text);
});

await page.goto(BASE_URL, {waitUntil:'networkidle2', timeout:60000});
await new Promise(r=>setTimeout(r,2500));

// --- 1. Search: type, then drive entirely by keyboard ---
await page.focus('#search-input');
await page.type('#search-input','shelter',{delay:20});
await new Promise(r=>setTimeout(r,900));

const optCount = await page.$$eval('#search-listbox [role="option"]', els=>els.length);
optCount > 0 ? pass('search renders options', optCount+' options') : fail('search renders options');

const comboRole = await page.$eval('#search-input', el=>el.getAttribute('role'));
comboRole==='combobox' ? pass('input has role=combobox') : fail('input has role=combobox', comboRole);

const listboxChildren = await page.$$eval('#search-listbox > *', els=>[...new Set(els.map(e=>e.getAttribute('role')))]);
JSON.stringify(listboxChildren)==='["option"]' ? pass('listbox contains only options') : fail('listbox children', JSON.stringify(listboxChildren));

await page.keyboard.press('ArrowDown');
let ad = await page.$eval('#search-input', el=>el.getAttribute('aria-activedescendant'));
ad==='search-option-0' ? pass('ArrowDown sets aria-activedescendant', ad) : fail('ArrowDown activedescendant', String(ad));

let sel = await page.$eval('#search-option-0', el=>el.getAttribute('aria-selected'));
sel==='true' ? pass('active option aria-selected=true') : fail('aria-selected', sel);

await page.keyboard.press('ArrowDown');
ad = await page.$eval('#search-input', el=>el.getAttribute('aria-activedescendant'));
ad==='search-option-1' ? pass('ArrowDown advances', ad) : fail('ArrowDown advances', String(ad));

await page.keyboard.press('ArrowUp');
ad = await page.$eval('#search-input', el=>el.getAttribute('aria-activedescendant'));
ad==='search-option-0' ? pass('ArrowUp goes back', ad) : fail('ArrowUp', String(ad));

// Enter activates
await page.keyboard.press('Enter');
await new Promise(r=>setTimeout(r,1200));
const resultsHidden = await page.$eval('#search-results', el=>el.hidden);
resultsHidden ? pass('Enter activates result and closes list') : fail('Enter closes list');

// --- 2. Escape closes ---
await page.focus('#search-input');
await page.evaluate(()=>{document.getElementById('search-input').value='';});
await page.type('#search-input','food',{delay:20});
await new Promise(r=>setTimeout(r,900));
await page.keyboard.press('Escape');
const escClosed = await page.$eval('#search-results', el=>el.hidden);
escClosed ? pass('Escape closes results') : fail('Escape closes results');

// --- 3. Tab order: how many tabs to reach the font-size control? ---
await page.goto(BASE_URL, {waitUntil:'networkidle2', timeout:60000});
await new Promise(r=>setTimeout(r,2500));
let steps=0, foundAt=-1, seen=[];
for (let i=0;i<25;i++){
  await page.keyboard.press('Tab'); steps++;
  const id = await page.evaluate(()=>document.activeElement.id || document.activeElement.className || document.activeElement.tagName);
  seen.push(id);
  if (id==='font-size-btn'){foundAt=steps;break;}
}
foundAt>0 && foundAt<=12 ? pass('font-size control reachable early', `${foundAt} tabs`) : fail('font-size tab distance', foundAt<0?('not found in 25; saw '+seen.join(',')):String(foundAt));

// --- 4. Directory modal: dialog semantics + focus restore ---
const dirLink = await page.$('a[data-directory-link]');
if (dirLink) {
  await page.evaluate(el=>{el.id='__triglink'; el.scrollIntoView();}, dirLink);
  await page.focus('#__triglink');
  await page.click('#__triglink');
  await new Promise(r=>setTimeout(r,600));

  const info = await page.$eval('#directory-overlay', el=>({
    role: el.getAttribute('role'),
    modal: el.getAttribute('aria-modal'),
    labelledby: el.getAttribute('aria-labelledby'),
    hidden: el.hidden
  }));
  info.role==='dialog' && info.modal==='true' ? pass('directory modal has dialog semantics', JSON.stringify(info)) : fail('dialog semantics', JSON.stringify(info));
  info.labelledby ? pass('dialog is labelled', info.labelledby) : fail('dialog labelled');

  // Everything outside the modal must be inert, at every level of the tree
  const bgInert = await page.evaluate(()=>{
    const modal=document.getElementById('directory-overlay');
    const leaks=[];
    document.querySelectorAll('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])').forEach(el=>{
      if (modal.contains(el)) return;
      if (el.closest('[inert]')) return;
      leaks.push(el.id||el.className||el.tagName);
    });
    return leaks;
  });
  bgInert.length===0 ? pass('background fully inert while modal open')
                     : fail('background inert', bgInert.length+' reachable outside modal: '+bgInert.slice(0,6).join(','));

  // Tab must not escape the dialog, and every control it lands on must show
  // a focus indicator. Checked here, while the dialog is definitely open.
  let escaped = null;
  const styles = [];
  for (let i=0;i<12;i++){
    await page.keyboard.press('Tab');
    const st = await page.evaluate(()=>{
      const el=document.activeElement, cs=getComputedStyle(el);
      return {inside: document.getElementById('directory-overlay').contains(el),
              cls:(el.className||el.tagName).toString().split(' ')[0],
              outline: cs.outlineStyle+' '+cs.outlineWidth,
              shadow: cs.boxShadow!=='none'};
    });
    if (!st.inside){ escaped = st.cls; break; }
    styles.push(st);
  }
  escaped===null ? pass('Tab stays inside the dialog (12 presses)') : fail('focus escaped dialog', escaped);

  const invisible = styles.filter(x=>x.outline==='none 0px' && !x.shadow);
  (styles.length>0 && invisible.length===0)
    ? pass('every dialog control shows a focus indicator', `${styles.length} controls`)
    : fail('dialog control with no focus indicator',
           styles.length===0 ? 'no controls measured' : invisible.map(x=>x.cls).join(', '));

  const focusInside = await page.evaluate(()=>document.getElementById('directory-overlay').contains(document.activeElement));
  focusInside ? pass('focus moved into modal') : fail('focus moved into modal');

  await page.keyboard.press('Escape');
  await new Promise(r=>setTimeout(r,500));
  const restored = await page.evaluate(()=>document.activeElement.id);
  restored==='__triglink' ? pass('focus restored to trigger on close', restored) : fail('focus restored', restored);

  const uninert = await page.evaluate(()=>[...document.body.children].some(c=>c.hasAttribute('inert')));
  !uninert ? pass('inert cleared after close') : fail('inert cleared');
} else {
  fail('directory link found');
}

// --- 5. font-size scaling is multiplicative ---
const scaleBefore = await page.evaluate(()=>getComputedStyle(document.documentElement).fontSize);
await page.evaluate(()=>{document.documentElement.style.setProperty('--font-size-scale','150%');});
const scaleAfter = await page.evaluate(()=>getComputedStyle(document.documentElement).fontSize);
scaleAfter!==scaleBefore ? pass('font scale applies', `${scaleBefore} -> ${scaleAfter}`) : fail('font scale', scaleBefore);
const usesPercent = await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--font-size-scale').trim());
usesPercent.endsWith('%') ? pass('font scale is a percentage, not px', usesPercent) : fail('font scale unit', usesPercent);

// --- 6. no forced new tabs, indicator preserved ---
const ext = await page.evaluate(()=>{
  const links=[...document.querySelectorAll('#resources-section a[href^="http"]')];
  const e=links.filter(l=>new URL(l.href).hostname!==location.hostname);
  const blank=e.filter(l=>l.target==='_blank');
  return {total:e.length, blank:blank.length,
          blankNonMap:blank.filter(l=>!l.classList.contains('map-link')).length,
          mapUnlabelled:blank.filter(l=>l.classList.contains('map-link') && !l.getAttribute('aria-label')).length,
          marked:e.filter(l=>l.hasAttribute('data-external')).length};
});
ext.blankNonMap===0 ? pass('no forced target=_blank on reading links', JSON.stringify(ext)) : fail('forced new tabs', JSON.stringify(ext));
ext.mapUnlabelled===0 ? pass('map links announce the new tab', ext.blank+' map links, all labelled') : fail('map link labels', ext.mapUnlabelled+' unlabelled');
ext.marked>0 ? pass('external links still marked for ↗ indicator', ext.marked+' marked') : fail('external marker', JSON.stringify(ext));

// --- 7. no outline:none focus killers remain reachable ---


// --- 8. Skip link must be fully off-screen until focused ---
await page.goto(BASE_URL, {waitUntil:'networkidle2', timeout:60000});
await new Promise(r=>setTimeout(r,2000));
const skipHidden = await page.evaluate(()=>{
  const r=document.querySelector('.skip-link').getBoundingClientRect();
  return {bottom:Math.round(r.bottom), height:Math.round(r.height)};
});
skipHidden.bottom<=0 ? pass('skip link fully hidden until focused', JSON.stringify(skipHidden))
                     : fail('skip link peeks over the header', JSON.stringify(skipHidden));

// --- 9. Every control gets a two-tone focus ring, immediately ---
const ringMisses=[];
const seenIds=new Set();
for (let i=0;i<10;i++){
  await page.keyboard.press('Tab');
  const st = await page.evaluate(()=>{
    const el=document.activeElement, cs=getComputedStyle(el);
    return {id: el.id || el.className.toString().split(' ')[0] || el.tagName,
            dark: cs.boxShadow.includes('11, 42, 107'),
            outline: cs.outlineWidth};
  });
  if (seenIds.has(st.id)) continue;
  seenIds.add(st.id);
  if (!st.dark) ringMisses.push(st.id);
}
ringMisses.length===0 ? pass('focus ring visible on every control tabbed', [...seenIds].join(', '))
                      : fail('controls with no dark focus ring', ringMisses.join(', '));

// --- 10. Reflow: no horizontal scrolling at any phone width or text size ---
// 320px is the WCAG 1.4.10 requirement (1280px at 400% zoom).
const reflow = [];
for (const [vw, vh, label] of [[320,512,'320px'],[375,667,'iPhone SE'],[412,915,'Pixel 8']]) {
  const mobile = await browser.newPage();
  await mobile.setViewport({width:vw, height:vh, isMobile:true, hasTouch:true, deviceScaleFactor:2});
  await mobile.goto(BASE_URL,{waitUntil:'networkidle2',timeout:60000});
  await new Promise(r=>setTimeout(r,2200));

  for (const scale of ['100%','110%','120%','130%','150%']) {
    await mobile.evaluate(sc=>document.documentElement.style.setProperty('--font-size-scale',sc), scale);
    await new Promise(r=>setTimeout(r,400));
    const m = await mobile.evaluate(()=>{
      const de = document.documentElement, off = [];
      const check = el => {
        if (!el || getComputedStyle(el).display === 'none') return;
        const r = el.getBoundingClientRect();
        if (innerWidth - r.right < -1 || innerHeight - r.bottom < -1 || r.left < -1 || r.top < -1) {
          off.push(el.id || el.className.toString().split(' ')[0]);
        }
      };
      ['share-btn','toc-btn','font-size-btn','install-btn','language-btn'].forEach(id=>check(document.getElementById(id)));
      check(document.querySelector('.feedback-fab'));
      return {sw: de.scrollWidth, cw: de.clientWidth, off};
    });
    if (m.sw > m.cw) reflow.push(`${label}@${scale} hscroll (${m.sw}>${m.cw})`);
    if (m.off.length) reflow.push(`${label}@${scale} offscreen:[${m.off}]`);
  }
  await mobile.close();
}
reflow.length===0
  ? pass('no horizontal scroll or off-screen buttons', '3 widths x 5 text sizes')
  : fail('reflow', reflow.slice(0,5).join(' ; '));

// --- 11. Search field: hidden label, visible affordance ---
const searchField = await page.evaluate(()=>{
  const lab=document.querySelector('.search-label');
  const r=lab.getBoundingClientRect();
  const inp=document.getElementById('search-input');
  return {hidden:r.width<=1&&r.height<=1, name:lab.textContent.trim(),
          forId:lab.getAttribute('for'), inputId:inp.id,
          noCompetingAriaLabel: !inp.hasAttribute('aria-label')};
});
(searchField.hidden && searchField.forId===searchField.inputId && searchField.noCompetingAriaLabel)
  ? pass('search label hidden but still names the field', JSON.stringify(searchField))
  : fail('search label', JSON.stringify(searchField));

// --- 12. Only one toolbar popup open at a time ---
await page.click('#font-size-btn'); await new Promise(r=>setTimeout(r,250));
await page.click('#language-btn');  await new Promise(r=>setTimeout(r,250));
const popups = await page.evaluate(()=>({
  font: !document.getElementById('font-size-popup').hidden,
  lang: !document.getElementById('language-popup').hidden,
  fontExpanded: document.getElementById('font-size-btn').getAttribute('aria-expanded')
}));
(!popups.font && popups.lang && popups.fontExpanded==='false')
  ? pass('opening one toolbar popup closes the other')
  : fail('popups overlap', JSON.stringify(popups));

// --- 13. Language resolution is cached (was ~1700 storage reads per load) ---
const cold = await browser.newPage();
await cold.evaluateOnNewDocument(()=>{
  window.__ls=0; const o=Storage.prototype.getItem;
  Storage.prototype.getItem=function(...a){window.__ls++;return o.apply(this,a);};
});
await cold.goto(BASE_URL,{waitUntil:'networkidle2',timeout:60000});
await cold.waitForFunction(()=>document.querySelectorAll('#resources-section a').length>100,{timeout:60000});
const lsReads = await cold.evaluate(()=>window.__ls);
lsReads < 50 ? pass('language lookup is cached', lsReads+' localStorage reads')
             : fail('excessive localStorage reads', lsReads+' reads');
await cold.close();


// --- 14. Skip link text must be readable against its own chip ---
await page.goto(BASE_URL, {waitUntil:'networkidle2', timeout:60000});
await new Promise(r=>setTimeout(r,2000));
await page.keyboard.press('Tab');
await new Promise(r=>setTimeout(r,300));
const skipColors = await page.evaluate(()=>{
  const cs=getComputedStyle(document.querySelector('.skip-link'));
  const lum = c => {
    const [r,g,b]=c.match(/\d+/g).slice(0,3).map(v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);});
    return 0.2126*r+0.7152*g+0.0722*b;
  };
  const a=lum(cs.color), b=lum(cs.backgroundColor);
  return {fg:cs.color, bg:cs.backgroundColor,
          ratio:+(((Math.max(a,b)+0.05)/(Math.min(a,b)+0.05)).toFixed(2))};
});
skipColors.ratio >= 4.5
  ? pass('skip link text contrast', `${skipColors.ratio}:1`)
  : fail('skip link text contrast', `${skipColors.ratio}:1 — ${skipColors.fg} on ${skipColors.bg}`);


// --- 15. Header nav must stay on one row at normal text size, every width ---
// The reflow matrix only covers phone widths, so a desktop-only wrap (caused
// by a wrapping flex container resolving to a two-button width) slipped past.
const navRows = [];
for (const vw of [1440, 1280, 1024, 900, 768, 600, 412, 375]) {
  const np = await browser.newPage();
  await np.setViewport({width: vw, height: 900});
  await np.goto(BASE_URL, {waitUntil:'networkidle2', timeout:60000});
  await new Promise(r=>setTimeout(r,1500));
  const rows = await np.evaluate(()=>
    new Set([...document.querySelectorAll('.nav-btn')]
      .map(b=>Math.round(b.getBoundingClientRect().top))).size);
  if (rows !== 1) navRows.push(`${vw}px:${rows} rows`);
  await np.close();
}
navRows.length===0
  ? pass('header nav stays on one row at normal text size', '8 widths, 375-1440px')
  : fail('header nav wraps', navRows.join(', '));


// --- 16. The app must not depend on any third-party origin ---
// Fonts and Leaflet used to come from CDNs, so neither survived going offline
// and OpenDyslexic — an accessibility feature — failed silently. See #419/#420.
{
  const iso = await browser.createBrowserContext();
  const np = await iso.newPage();
  const external = [];
  await np.setRequestInterception(true);
  np.on('request', r => {
    if (isThirdParty(r.url())) { external.push(new URL(r.url()).hostname); r.abort(); }
    else r.continue();
  });
  await np.goto(BASE_URL, {waitUntil:'networkidle2', timeout:60000});
  await new Promise(r=>setTimeout(r,2500));

  // Turn on the dyslexia font the way a reader would
  await np.click('#font-size-btn'); await new Promise(r=>setTimeout(r,400));
  await np.click('#opendyslexic-toggle'); await new Promise(r=>setTimeout(r,2500));

  const fonts = await np.evaluate(()=>({
    dyslexicUsable: document.fonts.check('400 1rem OpenDyslexic'),
    dyslexicApplied: document.body.classList.contains('opendyslexic-enabled'),
    montserratUsable: document.fonts.check('700 1rem "Montserrat Alternates"'),
    error: document.querySelector('.font-toggle-error')?.textContent || null
  }));

  const hosts = [...new Set(external)];
  hosts.length === 0
    ? pass('app makes no third-party requests', 'fully self-hosted')
    : fail('third-party requests', hosts.join(', '));

  (fonts.dyslexicUsable && fonts.dyslexicApplied && !fonts.error)
    ? pass('OpenDyslexic works with all external hosts blocked')
    : fail('OpenDyslexic offline', JSON.stringify(fonts));

  fonts.montserratUsable
    ? pass('Montserrat works with all external hosts blocked')
    : fail('Montserrat offline', 'font not usable');

  await iso.close();
}

// --- 17. Map pages: Leaflet must be local, and the list must not need it ---
{
  const iso = await browser.createBrowserContext();
  const mp = await iso.newPage();
  const external = [];
  await mp.setRequestInterception(true);
  mp.on('request', r => {
    if (isThirdParty(r.url())) { external.push(new URL(r.url()).hostname); r.abort(); }
    else r.continue();
  });
  await mp.goto(new URL('naloxone-locations-map.html', BASE_URL).href, {waitUntil:'domcontentloaded', timeout:60000});
  await new Promise(r=>setTimeout(r,3000));

  const map = await mp.evaluate(()=>({
    leaflet: typeof window.L !== 'undefined',
    markers: document.querySelectorAll('.leaflet-marker-icon').length,
    listItems: document.querySelectorAll('#location-list li').length,
    attribution: (document.querySelector('.leaflet-control-attribution')?.textContent || '').includes('OpenStreetMap')
  }));

  // Only map tiles may be external; the library itself must not be
  const nonTile = [...new Set(external)].filter(h => !h.includes('tile.openstreetmap.org'));
  nonTile.length === 0
    ? pass('map page loads Leaflet locally', 'only OSM tiles are remote')
    : fail('map page third-party requests', nonTile.join(', '));

  (map.leaflet && map.markers > 0)
    ? pass('map renders with no network', `${map.markers} markers`)
    : fail('map did not render offline', JSON.stringify(map));

  map.listItems > 0
    ? pass('map text alternative present offline', `${map.listItems} locations`)
    : fail('map text list missing', JSON.stringify(map));

  map.attribution
    ? pass('OpenStreetMap attribution rendered')
    : fail('OSM attribution missing', 'ODbL requires it');

  await iso.close();
}

console.log('\n--- page errors (uncaught exceptions) ---');
console.log(pageErrors.length ? pageErrors.slice(0,10).join('\n') : '(none)');

console.log('\n--- console errors ---');
console.log(consoleErrors.length ? consoleErrors.slice(0,10).join('\n') : '(none)');

if (resourceWarnings.length) {
  console.log('\n--- resource load warnings (not failures) ---');
  console.log([...new Set(resourceWarnings)].slice(0,5).join('\n'));
}
console.log('\n--- results ---');
for(const [s,n,d] of results) console.log(`${s.padEnd(4)} ${n}${d?'  ['+d+']':''}`);
const failed = results.filter(r=>r[0]==='FAIL').length;
console.log(`\n${results.length - failed}/${results.length} passed`);
await browser.close();

if (failed > 0 || pageErrors.length > 0 || consoleErrors.length > 0) {
  process.exitCode = 1;
}
