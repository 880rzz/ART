import fs from 'node:fs';

const css = fs.readFileSync('assets/css/site.css', 'utf8');
const errors = [];

// The Aug-15 approved visual baseline is the authority. CTA geometry must come
// from that source CSS and be verified by the exhaustive browser gate, not by
// generating a second production-only CSS contract.
for (const token of [
  'APPLE-RESPONSIVE-CONTRACT-V1:START',
  'APPLE-RESPONSIVE-CONTRACT-V1:END',
  '.hero-cta',
  '.btn'
]) if (!css.includes(token)) errors.push(`approved homepage CTA source contract missing: ${token}`);

const homes = [
  ['index.html', 'Gallery'],
  ['hu/index.html', 'Galéria'],
  ['de-at/index.html', 'Galerie']
];
for (const [path, label] of homes) {
  const html = fs.readFileSync(path, 'utf8');
  if (!new RegExp(`<div class="hero-cta">[\\s\\S]*?<a class="btn"[^>]*>${label}<\\/a>`).test(html)) errors.push(`${path}: ${label} hero CTA missing`);
  const matches=[...html.matchAll(/<div class="hero-cta">([\s\S]*?)<\/div>/g)];
  if(matches.length!==1) errors.push(`${path}: expected exactly one hero CTA group, found ${matches.length}`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('ART homepage hero CTA source contract passed: approved visual authority retained in EN/HU/DE; runtime geometry is enforced by the exhaustive browser gate.');
