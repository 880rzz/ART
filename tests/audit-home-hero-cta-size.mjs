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

// Phone two-up grid must wrap EN/HU/DE labels inside the pill — nowrap at
// readable STAGE91 size overflows longer theme labels / DE compounds.
const phoneHeroBtn = css.match(/@media\(max-width:640px\)\{[\s\S]*?body\.apple-archive \.hero-cta a\.btn\{([\s\S]*?)\}/);
if (!phoneHeroBtn) errors.push('phone hero CTA wrap contract missing: body.apple-archive .hero-cta a.btn inside max-width:640px');
else {
  const block = phoneHeroBtn[1];
  if (!/white-space:\s*normal/.test(block)) errors.push('phone hero CTA must use white-space:normal so labels stay inside the button');
  if (/white-space:\s*nowrap/.test(block)) errors.push('phone hero CTA must not force nowrap (overflows long EN/DE labels)');
}

// Title-gradient ring + text (same cool→gold stop as h1/h2 accents).
if (!/header\.hero \.hero-cta a\.btn::before/.test(css)) errors.push('hero CTA gradient border ring (::before) missing');
if (!/linear-gradient\(90deg,#EDF4FA,#A9C4DE 48%,#DCC56B 88%\)/.test(css)) errors.push('hero CTA must reuse the archive h1/h2 accent gradient');

const homes = [
  ['index.html', ['Gallery', 'Favorite themes', 'Exhibitions', 'Books'], ['/#works', '/#about', '/#exhibitions', '/#books']],
  ['hu/index.html', ['Galéria', 'Kedvenc témák', 'Kiállítások', 'Könyvek'], ['/hu/#works', '/hu/#about', '/hu/#exhibitions', '/hu/#books']],
  ['de-at/index.html', ['Galerie', 'Lieblingsthemen', 'Ausstellungen', 'Bücher'], ['/de-at/#works', '/de-at/#about', '/de-at/#exhibitions', '/de-at/#books']]
];
for (const [path] of homes) {
  const group = (fs.readFileSync(path, 'utf8').match(/<div class="hero-cta">([\s\S]*?)<\/div>/) || [])[1] || '';
  if (/private-photography|Privát fotózás|Private photography|Private Fotografie/i.test(group)) {
    errors.push(`${path}: private photography belongs in the menu, not the hero CTA row (Favorite themes replaced it)`);
  }
}
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
