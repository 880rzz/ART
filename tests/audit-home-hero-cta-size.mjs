import fs from 'node:fs';
import {
  applyArtifactCssContracts,
  HOME_HERO_CTA_START,
  HOME_HERO_CTA_END
} from '../scripts/apply-artifact-css-contracts.mjs';

const sourceCss = fs.readFileSync('assets/css/site.css', 'utf8');
const css = applyArtifactCssContracts(sourceCss);
const errors = [];
const from = css.indexOf(HOME_HERO_CTA_START);
const to = css.indexOf(HOME_HERO_CTA_END);
if (from < 0 || to < from) errors.push('generated homepage hero CTA size authority block missing');
const block = from >= 0 && to > from ? css.slice(from, to + HOME_HERO_CTA_END.length) : '';
for (const token of [
  '@media (min-width:641px)',
  'body.apple-archive[data-archive-page="index"] header.hero .hero-cta .btn',
  'inline-size:10.5rem!important',
  'min-inline-size:10.5rem!important',
  'max-inline-size:10.5rem!important'
]) if (!block.includes(token)) errors.push(`homepage hero CTA contract missing: ${token}`);
if (/max-width\s*:\s*640px|grid-template-columns/i.test(block)) errors.push('desktop CTA authority must not override the existing mobile grid contract');
if (applyArtifactCssContracts(css) !== css) errors.push('artifact CTA CSS application must be idempotent');

const homes = [
  ['index.html', 'Gallery'],
  ['hu/index.html', 'Galéria'],
  ['de-at/index.html', 'Galerie']
];
for (const [path, label] of homes) {
  const html = fs.readFileSync(path, 'utf8');
  if (!new RegExp(`<div class="hero-cta">[\\s\\S]*?<a class="btn"[^>]*>${label}<\\/a>`).test(html)) errors.push(`${path}: ${label} hero CTA missing`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('ART homepage hero CTA artifact contract passed: equal desktop CTA width in EN/HU/DE; mobile grid authority untouched.');
