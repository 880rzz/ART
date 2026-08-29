import fs from 'node:fs';
import path from 'node:path';

const css = fs.readFileSync('assets/css/site.css', 'utf8');
const errors = [];
const startMarker = '/* CANONICAL-ARCHIVE-DESIGN-SYSTEM-20260827:START';
const endMarker = '/* CANONICAL-ARCHIVE-DESIGN-SYSTEM-20260827:END */';
const start = css.indexOf(startMarker);
const end = css.indexOf(endMarker, start + startMarker.length);

if (start < 0 || end < 0 || end <= start) {
  errors.push('canonical archive palette authority block missing from site.css');
}

const finalAuthority = start >= 0 && end > start
  ? css.slice(start, end + endMarker.length)
  : '';

// Verify the accessible palette tokens in the canonical file.
for (const token of [
  '--art-bg:#202530',
  '--art-surface:#2D3444',
  '--art-raised:#29303F',
  '--art-ink:#F5F5F7',
  '--art-soft:#BED0E2',
  '--art-gold:#DCC56B'
]) {
  if (!css.includes(token)) errors.push('canonical palette variable missing ' + token);
}

// Surface ownership must remain in the one final canonical design block. The
// visual baseline uses spacing between sections rather than alternating panel
// fills; cards inherit their owning section's ground.
for (const token of [
  'CANONICAL-ARCHIVE-DESIGN-SYSTEM-20260827:START',
  'main>section:nth-of-type(even)',
  '--banhalmi-section-surface:var(--art-bg)',
  '#menu{background:rgba(32,37,48,.99)'
]) {
  if (!finalAuthority.includes(token)) errors.push('final palette contract missing ' + token);
}

for (const token of ['#0f0f0f', '#171717', '#211f1b', '--art-home-light:#484F60']) {
  if (finalAuthority.toLowerCase().includes(token.toLowerCase())) {
    errors.push('retired neutral/light surface in final authority ' + token);
  }
}

for (const token of ['--c-ground:#202530', '--c-raised:#29303F', '--c-panel:#2D3444']) {
  if (!css.includes(token)) errors.push('base palette missing ' + token);
}

const ch = v => (v /= 255) <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;
const lum = h => {
  h = h.slice(1);
  const a = [0, 2, 4].map(i => ch(parseInt(h.slice(i, i + 2), 16)));
  return .2126 * a[0] + .7152 * a[1] + .0722 * a[2];
};
const ratio = (a, b) => (Math.max(lum(a), lum(b)) + .05) / (Math.min(lum(a), lum(b)) + .05);

for (const [name, fg, bg] of [
  ['primary/ground', '#F5F5F7', '#202530'],
  ['soft/ground', '#BED0E2', '#202530'],
  ['gold/ground', '#DCC56B', '#202530'],
  ['primary/surface', '#F5F5F7', '#2D3444'],
  ['soft/surface', '#BED0E2', '#2D3444'],
  ['gold/surface', '#DCC56B', '#2D3444']
]) {
  const r = ratio(fg, bg);
  console.log(`${name}: ${r.toFixed(2)}:1`);
  if (r < 4.5) errors.push(`${name} contrast below 4.5:1`);
}

for (const prefix of ['', 'hu/', 'de-at/']) {
  for (const page of ['curators', 'press', 'community', 'writing']) {
    const file = prefix + page + '.html';
    const html = fs.readFileSync(file, 'utf8');
    if (!new RegExp(`data-archive-page=["']${page}["']`, 'i').test(html)) {
      errors.push(`${file}: static archive marker missing`);
    }
  }
}

const favicon = fs.readFileSync('assets/img/favicon.svg', 'utf8');
const logo = fs.readFileSync('assets/img/banhalmi-logo.svg', 'utf8');
const compactSvg = value => value.replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim();
if (!favicon.includes('<path') || favicon.includes('<image') || favicon.includes('data:image') || compactSvg(favicon) !== compactSvg(logo)) {
  errors.push('canonical vector favicon contract missing');
}
if (!logo.includes('fill="#DCC56B"')) errors.push('canonical gold logo missing');

const manifest = JSON.parse(fs.readFileSync('site.webmanifest', 'utf8'));
if (manifest.background_color !== '#202530' || manifest.theme_color !== '#202530') {
  errors.push('manifest theme is not #202530');
}

const svgs = [];
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.name.endsWith('.svg')) svgs.push(file);
  }
}
walk('assets');
for (const file of svgs) {
  const source = fs.readFileSync(file, 'utf8').toLowerCase();
  for (const bad of ['#0f0f0f', '#171717', '#211a11', '#c9a962']) {
    if (source.includes(bad)) errors.push(`${file}: retired visual colour ${bad}`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Canonical palette/contrast audit passed: quiet section grounds, six AA text combinations, ${svgs.length} SVG assets, favicon/logo and static curatorial markers.`);
