import { readFile } from 'node:fs/promises';

const css = await readFile('assets/css/homepage-two-tone-authority.css', 'utf8');
const pages = ['curators.html', 'hu/curators.html', 'de-at/curators.html'];
const errors = [];

if (!css.includes('[data-archive-page="curators"] main .curatorial-section > :is(.wrap,.narrow,.inner,.container){width:min(var(--bn-content-wide),calc(100% - (2 * var(--art-gutter))))!important;max-width:var(--bn-content-wide)!important}')) {
  errors.push('Curatorial dossiers must inherit the full shared archive canvas.');
}
if (/\[data-archive-page="curators"\][^{]*\{[^}]*width:min\(980px/.test(css)) {
  errors.push('The retired 980px curatorial canvas must not return.');
}

for (const page of pages) {
  const html = await readFile(page, 'utf8');
  if (!html.includes('data-archive-page="curators"')) errors.push(`${page}: curatorial page marker missing`);
  if (!html.includes('curatorial-periods')) errors.push(`${page}: shared curatorial period structure missing`);
}

if (errors.length) {
  console.error('Stage98 curatorial canvas audit failed:');
  for (const error of errors) console.error(' - ' + error);
  process.exit(1);
}

console.log('Stage98 passed: EN/HU/DE curatorial dossiers use the responsive wide archive canvas while prose keeps its readable measure.');
