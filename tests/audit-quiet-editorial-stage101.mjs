import { readFile } from 'node:fs/promises';

const css = await readFile('assets/css/homepage-two-tone-authority.css', 'utf8');
const palette = await readFile('assets/css/palette-blue-final.css', 'utf8');
const runtime = await readFile('assets/js/responsive-header-system.js', 'utf8');
const pages = await Promise.all([
  readFile('index.html', 'utf8'),
  readFile('hu/index.html', 'utf8'),
  readFile('de-at/index.html', 'utf8')
]);
const errors = [];

for (const token of [
  'STAGE101-QUIET-EDITORIAL-SYSTEM:START',
  '--art-home-light:#484F60',
  'STAGE101-FINAL-QUIET-AUTHORITY:START',
  '.press-archive-disclosure',
  '.record-gallery-disclosure',
  '.exhibitions-disclosure'
]) if (!css.includes(token)) errors.push(`Quiet editorial CSS contract missing: ${token}`);

for (const token of ['--art-surface-light:#484F60', '--c-panel:#484F60!important'])
  if (!palette.includes(token)) errors.push(`Lighter panel contract missing: ${token}`);

for (const token of [
  'STAGE101-PROGRESSIVE-DISCLOSURES',
  "page === 'press'",
  "'press-archive-disclosure'",
  "'record-gallery-disclosure'",
  "section.querySelectorAll('img').length >= 6"
]) if (!runtime.includes(token)) errors.push(`Progressive disclosure runtime missing: ${token}`);

const labels = ['View all 20 exhibitions', 'Mind a 20 kiállítás megnyitása', 'Alle 20 Ausstellungen öffnen'];
pages.forEach((html, index) => {
  if (!html.includes('<details class="exhibitions-disclosure">')) errors.push(`Homepage ${index + 1} has no closed exhibitions disclosure.`);
  if (!html.includes(labels[index])) errors.push(`Homepage ${index + 1} has no localized exhibitions summary.`);
  if (/<details class="exhibitions-disclosure"\s+open\b/i.test(html)) errors.push(`Homepage ${index + 1} opens exhibitions by default.`);
});

if (errors.length) {
  console.error('Stage101 quiet editorial audit failed:');
  for (const error of errors) console.error(' - ' + error);
  process.exit(1);
}

console.log('Stage101 passed: lighter AA panel, calmer rules and closed homepage/press/gallery catalogues are guarded in EN/HU/DE.');
