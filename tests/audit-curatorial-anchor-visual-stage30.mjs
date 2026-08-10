import fs from 'node:fs';

const failures = [];
const js = fs.readFileSync('assets/js/responsive-header-system.js', 'utf8');
const css = fs.readFileSync('assets/css/final-layout-fixes.css', 'utf8');
const palette = fs.readFileSync('assets/css/palette-blue-final.css', 'utf8');
const release = JSON.parse(fs.readFileSync('data/design-release.json', 'utf8')).release;

const jsTokens = [
  "const curatorialPages = new Set(['curators', 'press', 'community', 'writing'])",
  "target.scrollIntoView({ block: 'start', behavior: 'auto' })",
  "requestAnimationFrame(() => {",
  "alignFragmentTarget(true);",
  "const filename = `${page}.html`",
  "de: `/de-at/${filename}`",
  "hu: `/hu/${filename}`",
  "closeMenu();"
];
for (const token of jsTokens) if (!js.includes(token)) failures.push(`responsive-header-system.js missing ${token}`);
for (const retired of ['settleCurrentFragment', 'getBoundingClientRect', '[120, 360, 800, 1500]']) {
  if (js.includes(retired)) failures.push(`responsive-header-system.js retired fragment behavior returned: ${retired}`);
}

const cssTokens = [
  'body.apple-archive[data-archive-page="press"]',
  'body.apple-archive[data-archive-page="community"]',
  'body.apple-archive[data-archive-page="writing"]',
  'background:var(--c-ground)!important',
  '--press-paper:var(--c-ground)!important',
  '--press-warm:var(--c-raised)!important',
  'main+footer',
  'margin-top:0!important',
  'body.apple-archive [id]{scroll-margin-top:'
];
for (const token of cssTokens) if (!css.includes(token)) failures.push(`final-layout-fixes.css missing ${token}`);

for (const retired of ['background:#0f0f0f!important', 'background:#171717!important', '--press-paper:#0f0f0f!important', '--press-warm:#171717!important']) {
  if (css.includes(retired)) failures.push(`final-layout-fixes.css legacy neutral surface returned: ${retired}`);
}

const paletteTokens = [
  'STAGE70-HOMEPAGE-PALETTE-AUTHORITY:START',
  '--c-ground:#202530!important',
  '--c-raised:#29303F!important',
  '--c-panel:#2D3444!important',
  '--c-gold:#DCC56B!important'
];
for (const token of paletteTokens) if (!palette.includes(token)) failures.push(`palette-blue-final.css missing ${token}`);

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
  if (!html.includes(`responsive-header-system.js?v=${release}`)) failures.push(`${file}: responsive-header runtime is not on current release ${release}`);
  if (!html.includes(`final-layout-fixes.css?v=${release}`)) failures.push(`${file}: final visual layer is not on current release ${release}`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`Stage 30 curatorial visual audit passed on ${release}: homepage blue surfaces are authoritative, legacy neutral surfaces are forbidden, and fragment navigation remains native.`);
