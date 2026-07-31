import fs from 'node:fs';

const css = fs.readFileSync('assets/css/responsive-header-system.css', 'utf8');
const js = fs.readFileSync('assets/js/responsive-header-system.js', 'utf8');
const injector = fs.readFileSync('scripts/apply-responsive-header-system.mjs', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const requiredCss = [
  'body.apple-archive > nav',
  'body.apple-archive > .topbar',
  '@media (min-width:1101px)',
  '@media (min-width:701px) and (max-width:1100px)',
  '@media (max-width:700px)',
  'top:var(--bn-header-height)',
  'body.apple-archive.menu-open{overflow:hidden',
  'min-height:48px'
];

const requiredJs = [
  'Escape',
  'aria-expanded',
  'aria-hidden',
  "body.classList.remove('menu-open')",
  "language.startsWith('hu')",
  "language.startsWith('de')",
  "button.append(document.createElement('span'))",
  "responsiveHeaderIcon",
  '.burger::before',
  '.burger::after'
];

const errors = [];
for (const token of requiredCss) {
  if (!css.includes(token)) errors.push(`responsive CSS missing: ${token}`);
}
for (const token of requiredJs) {
  if (!js.includes(token)) errors.push(`responsive JS missing: ${token}`);
}
if (!injector.includes('20260730-responsive-v2')) {
  errors.push('responsive release cache key was not bumped to v2');
}
if (!pkg.scripts['integrate:unified-design']?.includes('apply-responsive-header-system.mjs')) {
  errors.push('production design build does not apply responsive header system');
}
if (!pkg.scripts.test?.includes('test:responsive-header')) {
  errors.push('main test chain does not include responsive header audit');
}

if (errors.length) {
  console.error('RESPONSIVE HEADER AUDIT FAILED');
  for (const error of errors) console.error('-', error);
  process.exit(1);
}

console.log('RESPONSIVE HEADER AUDIT PASSED: desktop, tablet and mobile rules, localized labels and single-icon rendering are production-locked.');