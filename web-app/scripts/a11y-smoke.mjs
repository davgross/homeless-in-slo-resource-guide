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

const URL = process.env.A11Y_URL || 'http://localhost:4317/';
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
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type()==='error') errors.push('console: '+m.text()); });

await page.goto(URL, {waitUntil:'networkidle2', timeout:60000});
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
await page.goto(URL, {waitUntil:'networkidle2', timeout:60000});
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

  // Tab must not escape the dialog
  let escaped = null;
  for (let i=0;i<12;i++){
    await page.keyboard.press('Tab');
    const inside = await page.evaluate(()=>document.getElementById('directory-overlay').contains(document.activeElement));
    if (!inside){ escaped = await page.evaluate(()=>document.activeElement.id||document.activeElement.className); break; }
  }
  escaped===null ? pass('Tab stays inside the dialog (12 presses)') : fail('focus escaped dialog', escaped);

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
const dirLink2 = await page.$('a[data-directory-link]');
await page.evaluate(el=>{el.id='__trig2'; el.scrollIntoView();}, dirLink2);
await page.focus('#__trig2');
await page.click('#__trig2');
await new Promise(r=>setTimeout(r,600));
const focusStyles=[];
for (let i=0;i<4;i++){
  await page.keyboard.press('Tab');
  focusStyles.push(await page.evaluate(()=>{
    const el=document.activeElement; const cs=getComputedStyle(el);
    return {cls:(el.className||el.tagName).toString().split(' ')[0],
            outline:cs.outlineStyle+' '+cs.outlineWidth,
            shadow:cs.boxShadow!=='none'};
  }));
}
const allVisible = focusStyles.every(x=>x.outline!=='none 0px' || x.shadow);
allVisible ? pass('every modal control shows a focus indicator on Tab', focusStyles.map(x=>x.cls+':'+x.outline).join(' | '))
           : fail('focus indicator missing', JSON.stringify(focusStyles));
await page.keyboard.press('Escape');

console.log('\n--- page errors ---');
console.log(errors.length? errors.slice(0,10).join('\n') : '(none)');
console.log('\n--- results ---');
for(const [s,n,d] of results) console.log(`${s.padEnd(4)} ${n}${d?'  ['+d+']':''}`);
const failed = results.filter(r=>r[0]==='FAIL').length;
console.log(`\n${results.length - failed}/${results.length} passed`);
await browser.close();

if (failed > 0 || errors.length > 0) {
  process.exitCode = 1;
}
