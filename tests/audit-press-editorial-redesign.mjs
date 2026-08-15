import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const pages = [
  ['press.html', 'Articles, interviews and television conversations'],
  ['hu/press.html', 'Cikkek, interjúk és televíziós beszélgetések'],
  ['de-at/press.html', 'Artikel, Interviews und Fernsehgespräche']
];
const errors = [];
const hrefSets = [];
const css = fs.readFileSync(path.join(root,'assets/css/site.css'),'utf8');

if (!css.includes('PRESS-EDITORIAL-REDESIGN-AUTHORITY:START') || !css.includes('PRESS-EDITORIAL-REDESIGN-AUTHORITY:END')) {
  errors.push('site.css: Press editorial authority marker missing');
}
for (const token of ['.press-facts','.press-period-nav','.press-record','.press-sources','@media']) {
  if (!css.includes(token)) errors.push(`site.css: Press authority missing ${token}`);
}

for (const [relative, heading] of pages) {
  const html = fs.readFileSync(path.join(root, relative), 'utf8');
  if (!html.includes('<main id="main-content" class="press-redesign">')) errors.push(`${relative}: redesigned main missing`);
  if (!html.includes(`<h1>${heading}</h1>`)) errors.push(`${relative}: direct H1 missing`);
  if (!html.includes('id="press-list" class="press-records"')) errors.push(`${relative}: visible press-list missing`);
  if (/<style\b/i.test(html) || /id=["']press-editorial-redesign["']/i.test(html)) errors.push(`${relative}: inline Press CSS returned; site.css must be the sole authority`);
  if (html.includes('class="press-types"') || html.includes('class="thesis"')) errors.push(`${relative}: old abstract preamble remains`);
  if (html.includes('verified from the current Wikipedia source list') || html.includes('a jelenlegi Wikipédia-forrásjegyzék alapján ellenőrizve') || html.includes('anhand der aktuellen Wikipedia-Quellenliste geprüft')) errors.push(`${relative}: repetitive video notes remain`);
  const ids = [...html.matchAll(/<article class="item press-record" id="press-(\d{2})"/g)].map(m => m[1]);
  const expected = Array.from({length: 35}, (_, i) => String(i + 1).padStart(2, '0'));
  if (JSON.stringify(ids) !== JSON.stringify(expected)) errors.push(`${relative}: expected press-01..press-35, found ${ids.length}`);
  if (!html.includes('"numberOfItems":35')) errors.push(`${relative}: schema count is not 35`);
  const listItems = (html.match(/"@type":"ListItem"/g) || []).length;
  if (listItems !== 35) errors.push(`${relative}: expected 35 schema ListItems, found ${listItems}`);
  const hrefs = [...html.matchAll(/<article class="item press-record"[^>]*>.*?<a class="press-record__title" href="([^"]+)"/gs)].map(m => m[1]);
  hrefSets.push([relative, hrefs]);
  for (const token of ['press-facts', 'press-period-nav', 'press-period-count', 'press-sources']) {
    if (!html.includes(token)) errors.push(`${relative}: ${token} missing`);
  }
}

const referenceHrefs = JSON.stringify(hrefSets[0][1]);
for (const [relative, hrefs] of hrefSets.slice(1)) {
  if (JSON.stringify(hrefs) !== referenceHrefs) errors.push(`${relative}: press source links differ from English`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Press editorial redesign audit passed: 35 records, 35 schema items, three languages, one CSS authority, no inline style drift.');
