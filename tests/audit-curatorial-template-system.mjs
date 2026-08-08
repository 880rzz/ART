import { readFile } from 'node:fs/promises';
import path from 'node:path';

// Permanent guard for the cross-language curatorial template contract.
// Behaviour stays in responsive-header-system.js; presentation belongs to the
// final museum-editorial.css authority. The audit protects both halves without
// requiring JavaScript to own CSS again.
const root = path.resolve(import.meta.dirname, '..');
const scriptPath = path.join(root, 'assets/js/responsive-header-system.js');
const museumPath = path.join(root, 'assets/css/museum-editorial.css');
const script = await readFile(scriptPath, 'utf8');
const museum = await readFile(museumPath, 'utf8');
const errors = [];

const requiredBehaviorTokens = [
  "new Set(['curators', 'press', 'community', 'writing'])",
  "body.dataset.archivePage = page",
  "hero.classList.add('curatorial-hero')",
  "main.prepend(hero)",
  "section.classList.add('curatorial-section')",
  "https://wa.me/4367761655592",
  "!destination.hash) return",
  "alignFragmentTarget",
  "target.scrollIntoView({ block: 'start', behavior: 'auto' })",
  "requestAnimationFrame(() => {",
  "alignFragmentTarget(true);"
];
for (const token of requiredBehaviorTokens) {
  if (!script.includes(token)) errors.push(`responsive-header-system.js: missing behavior contract ${token}`);
}
for (const retired of ['settleCurrentFragment', 'getBoundingClientRect', '[120, 360, 800, 1500]']) {
  if (script.includes(retired)) errors.push(`responsive-header-system.js: retired forced-reflow/settling contract returned: ${retired}`);
}

const requiredDesignTokens = [
  "/* STAGE37-STATIC-ARCHIVE-INTERFACE:START */",
  "linear-gradient(135deg,#202530 0%,#29303F 62%,#2D3444 100%)",
  "[data-archive-page=\"index\"] #journey",
  "[data-archive-page=\"index\"] #exhibitions",
  "-apple-system,BlinkMacSystemFont,\"SF Pro Text\",\"SF Pro Display\"",
  "--apple-cell-pad",
  ".professional-side__cta .btn",
  "white-space:nowrap",
  "main>:last-child::before",
  "main+footer",
  "body.apple-archive .burger::before,body.apple-archive .burger::after{content:none!important;box-shadow:none!important}",
  "/* STAGE37-STATIC-ARCHIVE-INTERFACE:END */"
];
for (const token of requiredDesignTokens) {
  if (!museum.includes(token)) errors.push(`museum-editorial.css: missing curatorial design contract ${token}`);
}

if (/createElement\s*\(\s*['\"]style['\"]\s*\)/.test(script)) {
  errors.push('responsive-header-system.js must remain presentation-free: runtime style creation detected');
}

const pages = [
  'index.html', 'hu/index.html', 'de-at/index.html',
  'curators.html', 'hu/curators.html', 'de-at/curators.html',
  'press.html', 'hu/press.html', 'de-at/press.html',
  'community.html', 'hu/community.html', 'de-at/community.html',
  'writing.html', 'hu/writing.html', 'de-at/writing.html'
];

for (const relative of pages) {
  const html = await readFile(path.join(root, relative), 'utf8');
  if (!html.includes('/assets/js/responsive-header-system.js')) {
    errors.push(`${relative}: shared responsive header script is missing`);
  }
  if (!html.includes('/assets/css/museum-editorial.css')) {
    errors.push(`${relative}: final museum editorial stylesheet is missing`);
  }
}

const presenceLabels = new Map([
  ['index.html', 'In pursuit of presence'],
  ['hu/index.html', 'A jelenlét nyomában'],
  ['de-at/index.html', 'Auf den Spuren der Präsenz']
]);
for (const [relative, label] of presenceLabels) {
  const html = await readFile(path.join(root, relative), 'utf8');
  if (!/id=["']journey["']/.test(html)) errors.push(`${relative}: journey section missing`);
  if (!/id=["']exhibitions["']/.test(html)) errors.push(`${relative}: exhibitions section missing`);
  if (!/id=["']about["']/.test(html)) errors.push(`${relative}: About anchor missing`);
  if (!html.includes(label)) errors.push(`${relative}: presence-led introduction label missing`);
  if (!html.includes('tel:+4367761655592')) errors.push(`${relative}: Vienna phone source link missing`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Curatorial template audit passed: behavior is guarded in canonical JavaScript without repeated layout settling, presentation remains in museum-editorial.css, and the shared multilingual page contract remains intact across 15 pages.');
