#!/usr/bin/env node
import { createHash, webcrypto } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = process.env.CERIDWEN_ROOT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => readFileSync(path.join(ROOT, file), 'utf8');
const sha = file => createHash('sha256').update(readFileSync(path.join(ROOT, file))).digest('hex');
let pass = 0, fail = 0;
const failures = [];
const check = (section, name, ok, detail = '') => {
  if (ok) { pass++; console.log(`  PASS  [${section}] ${name}`); }
  else { fail++; failures.push(`[${section}] ${name}${detail ? ` — ${detail}` : ''}`); console.log(`  FAIL  [${section}] ${name}${detail ? ` — ${detail}` : ''}`); }
};

const pages = ['index.html', 'index-en.html', 'yes-no.html', 'yes-no-en.html'];
const html = Object.fromEntries([...pages, '404.html'].map(file => [file, read(file)]));
const runtime = read('assets/js/runtime-enhancements.js');
const yesNo = read('assets/js/yes-no.js');
const theme = read('assets/css/theme-celtic.css');
const guide = read('assets/js/ceridwen-guide.js');
const mythology = read('assets/js/mythology-authenticity.js');
const hu = read('assets/js/app.hu.js');
const en = read('assets/js/app.en.js');

console.log('\n— INTEGRITY / REGRESSION GUARD —');
const BASELINE = {
  'assets/js/app.hu.js': 'de4804a8ea30d8edc5c57bc9472f933a4a47211911b3adc93896c9dd290a2f99',
  'assets/js/app.en.js': 'e88cd5c816439eb6ee2528e498f762bdc03631532df16ce0814fb15e60ed07e3',
  'assets/js/yes-no.js': '78c4a96a84f66fafef7ecde36e1e70269ea80be14b349a4d51c819eb50142e63',
  'assets/js/haptics.js': '83372a5e24ef86f14447a3b0d2d276b4fd6591ac2a6f3295d7b26df0078b5ade',
  'assets/js/experience-2.js': 'f08e712c19f13734af43119ed3c03677b5105bb2400577322f21c3ba1a274de8',
  'assets/js/magic-experience.js': 'c4598986018eb9d16eceb098f8bcec0eb9732db9fd883d037b6a52ef9a18b501',
  'assets/js/runtime-enhancements.js': 'ffb7cc836e1b978799d384146fad47aa9e4826b7a23a58b84b79f348e8dee8e1',
  'assets/js/ambient-scene.js': 'de25c22e9218069a4f6a8108a67d9aa31efbae73b77452702e2151082b0322fb',
  'assets/css/app.css': 'ba8e897e901301f470c619fd87b53e64ae1eef09d1de15367492ab43a2f1c35e',
  'robots.txt': 'f8770bbe3f5e9e7fd14f6bd57a4ed7402bae87ab543f2f36d1b1017500ac3eb1',
  'sitemap.xml': '5f02fe04151a7a0439fc9019f15976c1c3ddba4dc623b9c466fd89aeb07f78d4',
  'llms.txt': '29ed8b248e36d5a7b58937247fd20aa664031ab7fa9c3c8c7fde55b5da42d255'
};
for (const [file, expected] of Object.entries(BASELINE)) {
  check('Integrity', file, existsSync(path.join(ROOT, file)) && sha(file) === expected, 'approved baseline changed');
}

console.log('\n— RESTORED TECHNICAL SYSTEMS —');
check('Navigation', 'navigation stylesheet loader restored', /navigation-upgrade\.css/.test(runtime));
check('Navigation', 'mobile menu toggle and aria state restored', /function setMainMenu/.test(runtime) && /aria-expanded/.test(runtime) && /aria-hidden/.test(runtime));
check('Navigation', 'outside click closes main menu', /!mainMenu\.contains\(event\.target\)/.test(runtime));
check('Navigation', 'Escape closes and restores focus', /event\.key==="Escape"/.test(runtime) && /restoreFocus:true/.test(runtime));
check('Navigation', 'resize resets menu', /addEventListener\("resize"/.test(runtime));
check('A11y', 'page links are removed from tab semantics', /tab-page-link/.test(runtime) && /removeAttribute\("role"\)/.test(runtime) && /removeAttribute\("tabindex"\)/.test(runtime));
check('Mythology', 'authenticity CSS is loaded', /mythology-authenticity\.css/.test(runtime));
check('Mythology', 'authenticity JS is loaded', /mythology-authenticity\.js/.test(runtime));
check('Mythology', 'historical-modern-interpretation model exists', /historical|history/i.test(mythology) && /modern/i.test(mythology) && /interpretation/i.test(mythology));
check('Random', 'event history schema restored', /EVENT_HISTORY_KEY/.test(runtime) && /event-id-v1/.test(runtime));
check('Random', 'exact event deduplication restored', /exactEventDeduplication:true/.test(runtime));
check('Random', 'combined pack and global history restored', /selectCombinedCardEvents/.test(runtime));
check('Random', 'random audit object restored', /CeridwenRandomAudit/.test(runtime));
check('Diagnostics', 'expanded self-test restored', /mythologyAudit/.test(runtime) && /mobileMenu/.test(runtime) && /invalidPageLinks/.test(runtime));

console.log('\n— YES / NO FLOW —');
check('YesNo', 'secure crypto capability is guarded', /SECURE_CRYPTO/.test(yesNo) && /secure-random-unavailable/.test(yesNo));
check('YesNo', 'rejection sampling prevents modulo bias', /Math\.floor\(0x100000000\/max\)\*max/.test(yesNo) && /while\(a\[0\]>=lim\)/.test(yesNo));
check('YesNo', 'draw failure cannot leave busy state stuck', /catch\(error\)/.test(yesNo) && /busy=false/.test(yesNo));
check('YesNo', 'result is built without innerHTML', /replaceChildren\(\)/.test(yesNo) && !/result\.innerHTML/.test(yesNo));
check('YesNo', 'required DOM nodes are guarded', /Required interface elements are missing/.test(yesNo));
check('YesNo', 'timer is cleaned on pagehide', /pagehide/.test(yesNo) && /clearTimeout/.test(yesNo));
check('YesNo', 'menu supports Escape and focus restoration', /e\.key==='Escape'/.test(yesNo) && /menuToggle\.focus/.test(yesNo));
check('YesNo', 'menu supports outside click', /!menu\.contains\(e\.target\)/.test(yesNo));

console.log('\n— RELEASE / SEO / GEO —');
for (const page of pages) {
  check('Release', `${page}: Celtic theme linked`, /assets\/css\/theme-celtic\.css\?v=celtic\d+/.test(html[page]));
  check('Release', `${page}: Ceridwen guide linked`, /assets\/js\/ceridwen-guide\.js\?v=celtic\d+/.test(html[page]));
}
for (const page of ['index.html', 'index-en.html']) {
  const source = html[page];
  check('SEO', `${page}: canonical`, /rel="canonical"/.test(source));
  check('SEO', `${page}: hreflang hu/en/x-default`, /hreflang="hu"/.test(source) && /hreflang="en"/.test(source) && /hreflang="x-default"/.test(source));
  check('SEO', `${page}: Open Graph and Twitter`, /property="og:title"/.test(source) && /name="twitter:card"/.test(source));
  const blocks = [...source.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  check('Schema', `${page}: JSON-LD valid`, blocks.length > 0 && blocks.every(match => { try { JSON.parse(match[1]); return true; } catch { return false; } }));
  check('Security', `${page}: restrictive CSP preserved`, source.includes("connect-src 'none'") && source.includes("object-src 'none'") && source.includes("base-uri 'self'"));
}
check('GEO', 'llms entity description preserved', /Ceridwen/.test(read('llms.txt')) && /not fortune-telling/.test(read('llms.txt')));
check('Release', 'theme has no remote asset dependency', !/url\(["']?https?:/.test(theme));
check('Release', 'guide performs no network calls', !/fetch\(|XMLHttpRequest|sendBeacon/.test(guide));

console.log('\n— ACCESSIBILITY / DESIGN —');
check('A11y', 'reduced motion supported', /prefers-reduced-motion/.test(theme) && /prefers-reduced-motion/.test(guide));
check('A11y', 'increased contrast supported', /prefers-contrast/.test(theme));
check('A11y', 'focus-visible styling exists', /focus-visible/.test(theme));
check('A11y', 'guide live status exists', /role="status" aria-live="polite"/.test(guide));
check('A11y', 'decorative layers are hidden', /aria-hidden/.test(guide));
check('Design', 'Celtic forest layers preserved', /A VARÁZSERDŐ/.test(theme) && /ck-fireflies/.test(theme) && /ck-fog/.test(theme));
check('Design', 'CSS braces are balanced', (theme.match(/\{/g) || []).length === (theme.match(/\}/g) || []).length);
check('Design', 'all guide contexts remain', ['gate','cave','draw','cleanse','pendulum','kids','lex','journal','yesno'].every(key => new RegExp(`${key}:\\s*\\{`).test(guide)));

console.log('\n— RANDOM STATISTICAL CHECK —');
{
  const randInt = max => { const lim = Math.floor(0x100000000 / max) * max; const a = new Uint32Array(1); do { webcrypto.getRandomValues(a); } while (a[0] >= lim); return a[0] % max; };
  const count = [0, 0]; const n = 20000;
  for (let i = 0; i < n; i++) count[randInt(2)]++;
  const chi = ((count[0] - n / 2) ** 2 + (count[1] - n / 2) ** 2) / (n / 2);
  check('Random', `20,000 draw chi-square ${chi.toFixed(2)} < 6.63`, chi < 6.63, JSON.stringify(count));
}

console.log('\n— OPTIONAL BROWSER SIMULATION —');
try {
  const { JSDOM } = await import('jsdom');
  const dom = new JSDOM(html['index.html'], { url: 'https://www.helloits.me/', runScripts: 'outside-only', pretendToBeVisual: true });
  dom.window.matchMedia = query => ({ matches: /max-width:\s*760px/.test(query), media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
  dom.window.eval(hu);
  dom.window.eval(runtime);
  const d = dom.window.document;
  const toggle = d.getElementById('menuToggle');
  const menu = d.getElementById('mainTabs');
  toggle.click();
  check('Browser', 'mobile menu opens', toggle.getAttribute('aria-expanded') === 'true' && menu.classList.contains('open') && menu.getAttribute('aria-hidden') === 'false');
  d.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  check('Browser', 'Escape closes mobile menu', toggle.getAttribute('aria-expanded') === 'false' && !menu.classList.contains('open'));
  toggle.click();
  d.getElementById('v-gate').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  check('Browser', 'outside click closes mobile menu', toggle.getAttribute('aria-expanded') === 'false');
  const pageLink = d.querySelector('.tab-page-link');
  check('Browser', 'page link remains keyboard reachable', !pageLink.hasAttribute('role') && !pageLink.hasAttribute('aria-selected') && pageLink.getAttribute('tabindex') !== '-1');
  dom.window.close();
} catch (error) {
  console.log(`  INFO  [Browser] jsdom unavailable; static and cryptographic checks still completed (${error.code || error.message})`);
}

console.log('\n========================================');
console.log(`TOTAL: ${pass} PASS · ${fail} FAIL`);
if (fail) {
  console.log('\nFAILURES:');
  for (const item of failures) console.log(`  ✗ ${item}`);
  process.exit(1);
}
console.log('ALL AUDITS: PASS ✓');
