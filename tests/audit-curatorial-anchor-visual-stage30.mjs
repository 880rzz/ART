import fs from 'node:fs';

const failures = [];
const js = fs.readFileSync('assets/js/responsive-header-system.js', 'utf8');
const css = fs.readFileSync('assets/css/final-layout-fixes.css', 'utf8');

const jsTokens = [
  "const curatorialPages = new Set(['curators', 'press', 'community', 'writing'])",
  'settleCurrentFragment',
  "window.addEventListener('load', settleCurrentFragment",
  "window.addEventListener('hashchange', settleCurrentFragment)",
  "const filename = `${page}.html`",
  "de: `/de-at/${filename}`",
  "hu: `/hu/${filename}`",
  "closeMenu();"
];
for (const token of jsTokens) if (!js.includes(token)) failures.push(`responsive-header-system.js missing ${token}`);

const cssTokens = [
  'body.apple-archive[data-archive-page="press"]',
  'body.apple-archive[data-archive-page="community"]',
  'body.apple-archive[data-archive-page="writing"]',
  'background:#0f0f0f!important',
  'main+footer',
  'margin-top:0!important',
  'body.apple-archive [id]{scroll-margin-top:'
];
for (const token of cssTokens) if (!css.includes(token)) failures.push(`final-layout-fixes.css missing ${token}`);

const homes = ['index.html', 'hu/index.html', 'de-at/index.html'];
const targets = ['works', 'about', 'journey', 'exhibitions', 'books', 'contact'];
for (const file of homes) {
  const html = fs.readFileSync(file, 'utf8');
  for (const id of targets) {
    const pattern = new RegExp(`id=["']${id}["']`, 'i');
    if (!pattern.test(html)) failures.push(`${file}: missing #${id} target used by archive navigation`);
  }
}

const curatorial = [
  'press.html','community.html','writing.html',
  'hu/press.html','hu/community.html','hu/writing.html',
  'de-at/press.html','de-at/community.html','de-at/writing.html'
];
for (const file of curatorial) {
  const html = fs.readFileSync(file, 'utf8');
  if (!html.includes('responsive-header-system.js?v=20260807-curatorial-anchor-v47')) {
    failures.push(`${file}: not on curatorial-anchor-v47 runtime`);
  }
  if (!html.includes('final-layout-fixes.css?v=20260807-curatorial-anchor-v47')) {
    failures.push(`${file}: not on curatorial-anchor-v47 visual layer`);
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('Stage 30 curatorial visual and fragment-navigation regression audit passed.');
