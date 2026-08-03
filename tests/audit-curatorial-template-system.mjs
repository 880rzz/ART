import { readFile } from 'node:fs/promises';
import path from 'node:path';

// Permanent guard for the cross-language curatorial template contract.
// It protects reference-page parity, stable About navigation, Apple spacing,
// contact links, cell insets and the footer boundary together.
const root = path.resolve(import.meta.dirname, '..');
const scriptPath = path.join(root, 'assets/js/responsive-header-system.js');
const script = await readFile(scriptPath, 'utf8');
const errors = [];

const requiredTokens = [
  "new Set(['curators', 'press', 'community', 'writing'])",
  "body.dataset.archivePage = page",
  "hero.classList.add('curatorial-hero')",
  "main.prepend(hero)",
  "section.classList.add('curatorial-section')",
  "dataset.archiveInterfaceSystem",
  "linear-gradient(135deg,#111 0%,#252525 62%,#1d1912 100%)",
  "[data-archive-page=\"index\"] #journey",
  "[data-archive-page=\"index\"] #exhibitions",
  "-apple-system,BlinkMacSystemFont,\"SF Pro Text\",\"SF Pro Display\"",
  "--apple-cell-pad",
  ".professional-side__cta .btn",
  "white-space:nowrap",
  "https://wa.me/4367761655592",
  "!destination.hash) return",
  "window.setTimeout(alignTarget, 650)",
  "main>:last-child::before",
  "main+footer"
];

for (const token of requiredTokens) {
  if (!script.includes(token)) errors.push(`responsive-header-system.js: missing ${token}`);
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

console.log('Curatorial template audit passed: one hero/section system, stable About navigation, Apple spacing, WhatsApp contact, homepage chapters and single footer boundary are guarded across 15 pages.');
