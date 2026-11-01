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
  ['index.html', ['Gallery', 'Private artistic photography', 'Exhibitions', 'Books'], ['/#works', '/private-photography.html', '/#exhibitions', '/#books']],
  ['hu/index.html', ['Galéria', 'Privát művészeti fotózás', 'Kiállítások', 'Könyvek'], ['/hu/#works', '/hu/private-photography.html', '/hu/#exhibitions', '/hu/#books']],
  ['de-at/index.html', ['Galerie', 'Private künstlerische Fotografie', 'Ausstellungen', 'Bücher'], ['/de-at/#works', '/de-at/private-photography.html', '/de-at/#exhibitions', '/de-at/#books']]
];
for (const [path, labels, hrefs] of homes) {
  const html = fs.readFileSync(path, 'utf8');
  const matches=[...html.matchAll(/<div class="hero-cta">([\s\S]*?)<\/div>/g)];
  if(matches.length!==1) errors.push(`${path}: expected exactly one hero CTA group, found ${matches.length}`);
  const group = matches[0]?.[1] || '';
  for (const label of labels) {
    if (!new RegExp(`<a class="btn"[^>]*>${label}<\\/a>`).test(group)) errors.push(`${path}: ${label} hero CTA missing`);
  }
  for (const href of hrefs) {
    if (!group.includes(`href="${href}"`)) errors.push(`${path}: hero CTA href missing ${href}`);
  }
  if (/collectors|Gyűjtőknek|Sammler/i.test(group)) errors.push(`${path}: collectors hero CTA must be replaced by exhibitions/books`);
  const buttons = [...group.matchAll(/<a class="btn"/g)];
  if (buttons.length !== 4) errors.push(`${path}: expected 4 hero CTAs, found ${buttons.length}`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('ART homepage hero CTA source contract passed: approved visual authority retained in EN/HU/DE; runtime geometry is enforced by the exhaustive browser gate.');
